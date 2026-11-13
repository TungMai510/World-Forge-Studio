# WorldForge Studio — Phase 4 Persistence & Archive Specification

**Status:** Implementation plan / Phase 4 in progress  
**Date:** 13 November 2026  
**Scope:** durable project persistence, asset snapshots, portable `.wforge` archive  
**Related:** `ROADMAP_WORLD_FORGE_STUDIO.md`, `ASSET_PACK_SPECIFICATION.md`, `TOOL_ASSET_INTEGRATION_SPECIFICATION.md`

## 1. Goal

A project must remain valid and renderable after save/reopen, export/import, Pack disable/uninstall, or transfer to another machine. Semantic map objects and their canonical Asset Pack references must be preserved. The archive must carry the actual bytes of assets used by the project, not depend on the source Pack being installed.

Phase 4 is complete only when the round-trip workflow passes:
**Create/use assets → Save → Close/reopen → Export → remove/disable source Pack → Import → Reopen and render.**

## 2. Repository baseline (13 Nov 2026)

The repository already contains a partial persistence/archive foundation:

- `DatabaseManager` stores projects and recent-project records in IndexedDB (database version 1).
- `ProjectService` validates and stores project data (project schema version 2), migrates schema v1, and validates map/geography/civilization/history relationships.
- `archive-service.js` writes and reads ZIP STORE archives, checks CRC32, rejects encrypted/compressed entries, unsafe/duplicate paths, and applies entry/expanded-size limits.
- `ProjectService.exportProjectPackage()` and `importProjectPackage()` create/read `.wforge` packages and externalize embedded image data URLs.
- Image map objects preserve semantic `assetRef` (`packId`, `assetId`, optional `packVersion`). Runtime asset bytes currently live in the in-memory AssetRegistry/AssetPackService.
- The current archive exporter does **not** resolve `assetRef` against AssetRegistry and therefore does not yet embed Pack-backed image bytes. After a Pack is removed or unavailable on another machine, those objects can only show the renderer's missing-asset fallback.
- Project save currently serializes project domain data; no durable Pack registry or project-level embedded snapshot resolver has been established.

This means Phase 4 is not starting from zero. The ZIP and project data layers exist; the main gap is connecting semantic asset references to durable snapshots and making recovery behavior deterministic.

## 3. Required data model

### 3.1 Keep semantic references canonical

Do not replace or rewrite `assetRef` during save/export. Preserve:
- `packId`
- `assetId`
- `packVersion` when known

The reference identifies the origin of the asset and supports attribution, license checks, provenance and future relinking.

### 3.2 Add project-scoped embedded snapshots

Add a versioned project data collection (proposed: `data.assetSnapshots`) keyed by a stable canonical key such as `<packId>::<assetId>::<packVersion>`. Each snapshot record contains:
- canonical asset reference;
- original MIME type and safe file extension;
- byte length;
- SHA-256 checksum;
- snapshot bytes represented in a storage-safe form at the persistence boundary.

Only assets referenced by map objects should be embedded. Do not copy every asset in an installed Pack. Deduplicate repeated references to the same canonical asset.

A missing/disabled Pack must not delete an existing snapshot. A newer Pack version must not silently replace the bytes already embedded in an existing project.

### 3.3 Resolution priority

For rendering an image object:
1. use the matching enabled Pack asset when the reference/version is compatible;
2. otherwise use the project's verified embedded snapshot;
3. otherwise render the existing missing-asset fallback and expose a recoverable missing-reference state.

Never mutate the canonical `assetRef` merely because the snapshot was used. Never silently substitute a different version of the same asset.

## 4. Archive format

Keep the existing `.wforge` ZIP STORE container and `manifest.json` + `project.json` entries. Introduce a backward-compatible archive format revision (manifest formatVersion 2) with:
- project schema version;
- asset snapshot count;
- per-snapshot path, canonical reference, MIME type, byte length and SHA-256;
- explicit archive limits and format metadata.

Store binary data under deterministic safe paths, e.g. `assets/<sha256>.<ext>`. The manifest must not permit arbitrary paths. Verify path allowlist, count, byte length, MIME/extension, checksum and duplicate references before accepting an archive. Reject unexpected entries, missing files, unreferenced files and checksum mismatches.

Continue importing existing formatVersion 1 packages. Existing JSON project import remains supported.

## 5. Persistence boundaries

- IndexedDB project persistence must store project metadata, domain data and embedded snapshots atomically as one project record (or through a deliberate multi-store transaction if snapshots are normalized later).
- Pack installation persistence is not Phase 4 scope; that belongs to Phase 5. A project snapshot must work even if no Pack is installed.
- Save must not mutate the live map object graph.
- Export must produce a self-contained archive from the current project data and resolved snapshots.
- Import must validate the complete archive and all snapshots before writing anything to IndexedDB; malformed imports must not leave partial projects.
- Enforce a clear aggregate size limit and per-file limit. Avoid unbounded base64 expansion in memory; prefer Uint8Array/Blob at archive boundaries where practical.

## 6. Implementation slices

### 4.1 — Asset snapshot contract and resolution
- Define snapshot key/record helpers and validation.
- Resolve each unique image `assetRef` through AssetRegistry/AssetLoader.
- Capture bytes, MIME type, Pack version and SHA-256.
- Preserve missing references as explicit diagnostics; do not silently skip them.
- Add renderer/loader fallback to verified project snapshot without changing semantic object identity.

### 4.2 — Project save/load integration
- Connect ProjectService save/open to the current project snapshot collection.
- Ensure save/reopen retains snapshots and semantic references.
- Keep older project schema migration behavior; add a migration only when the data shape changes.
- Test disabled/uninstalled Pack behavior after reload.

### 4.3 — Portable archive v2
- Export only snapshots actually referenced by project objects.
- Include manifest integrity metadata and binary entries.
- Import v2 safely and retain v1 compatibility.
- Validate all entries before database writes.

### 4.4 — Round-trip hardening
- Duplicate references deduplicate to one snapshot.
- Pack version mismatch never silently substitutes bytes.
- Missing source Pack, corrupt archive, corrupt checksum, path traversal, duplicate entries, oversized archives and partial failures are covered.
- Offline save/open/render works after a snapshot exists.

## 7. Security and integrity

- Treat project archives as untrusted input.
- Reuse ZIP path, CRC, entry-count and expanded-size defenses; add SHA-256 for snapshot integrity.
- Allow only supported raster image MIME types already accepted by Asset Pack v1. Do not enable SVG, HTML, scripts, fonts, audio or remote URL fetching through project snapshots.
- Do not trust MIME metadata alone; verify extension and image signature using the existing Asset Pack validation policy.
- Never execute content from an archive.
- Reject path traversal, absolute paths, duplicate names, unreferenced binary files and undeclared entries.
- Import is all-or-nothing.

## 8. Acceptance tests

1. Save a project containing one Pack-backed image; reload and render it.
2. Save two objects referencing the same asset; archive contains one snapshot.
3. Disable the source Pack; project still renders from its snapshot.
4. Uninstall the source Pack; project still renders from its snapshot.
5. Export a project; remove the Pack; import the archive; render correctly.
6. Transfer/import on a clean browser profile with no Pack installed; render correctly.
7. Preserve `assetRef`, Pack version, transform, opacity, fit and semantic object type.
8. Import existing archive formatVersion 1 and legacy JSON project.
9. Reject bad checksum, missing snapshot, duplicate/unsafe path, unexpected entry, unsupported MIME and over-limit archive without creating a partial project.
10. Save/reopen with no network connection after assets are already embedded.
11. Confirm Undo/Redo and normal map editing remain unaffected by snapshot storage.
12. Confirm projects without Pack-backed images still save/export/import exactly as before.

## 9. Explicitly out of scope

- Installed Pack registry persistence, Pack Manager UI, update/rollback UX (Phase 5).
- Asset Pack authoring/export (Phase 6).
- Cloud sync, collaboration, account services or remote storage.
- Advanced selection and geometry enhancements (deferred Tool Enhancement phases).


## 10. Implementation progress — 13 November 2026

### Phase 4.1 implementation slice committed

- Added `project-asset-snapshot-service.js` to discover Pack-backed references in map data (image, pattern and texture references), deduplicate them by Pack/version/asset identity, and capture JSON-safe base64 bytes with MIME, byte size and SHA-256 metadata.
- Snapshot capture is bounded to 20 MB per project snapshot collection. Missing Pack assets may reuse an existing snapshot; otherwise save fails with an actionable error rather than silently discarding the dependency.
- Project save now captures snapshots from the live Asset Registry and stores them in `project.data.assetSnapshots`; project open installs that collection into the AssetLoader.
- AssetLoader resolves from the enabled compatible Pack first, then from the project snapshot. The canonical `assetRef` on map objects is unchanged. Required Pack versions are passed through the renderer.
- Added tests for deduplication, retaining snapshots after Pack uninstall, and fallback after Pack disable.

### Remaining work after Phase 4.1 acceptance

- Snapshot SHA-256 is generated at capture time and its metadata/byte length are checked when loaded; cryptographic digest re-verification on every read is still required before treating imported or externally modified project data as trusted. This must be completed with archive integrity work.
- Project archive export/import remains formatVersion 1 and does not yet externalize/embed `assetSnapshots` as declared archive entries. Portable transfer is not complete.
- Browser-level QA for save/reopen and Pack disable/uninstall was confirmed complete by the user on 13 November 2026. Clean-profile archive import remains pending until Phase 4.3.
- The LAN HTTP SHA-256 fallback and its automated test passed. Same-session Pack removal was corrected by activating snapshots immediately after save and triggering renderer invalidation. The user confirmed Phase 4.1 browser testing complete on 13 November 2026.


### Phase 4.1 acceptance record — 13 November 2026

**Status: COMPLETE (user-confirmed).** Browser verification passed: project save/reopen retains images, and removing the Asset Pack during the active session no longer removes rendered images. The automated suites had previously passed 76/76 and 79/79; SHA-256 fallback and same-session regression coverage were subsequently added. Phase 4.1 is accepted as the snapshot capture and runtime resolution foundation.

**Next:** Phase 4.2 formalizes persistence guarantees and save/load regression coverage. Existing save/open wiring remains in place and should be hardened, not duplicated.
