# CURRENT_PHASE_CONTEXT — World Forge Studio

> Operational context for coding agents. Keep under 150 lines; verify every API/path against source before each handoff.
> Product/architecture source of truth: `WORLD_FORGE_STUDIO_MASTER.md`.
> AI task workflow: `AI_WORKFLOW_AND_MODEL_RESPONSIBILITIES.md`.
> Repository: `TungMai510/World-Forge-Studio` · branch: `main` · app: `worldforge_ui_prototype/`
> Last documentation alignment: 14/11/2026. This file records inspected structure and approved work order, not implementation completion.

## 1. Active milestone and execution order

**Active: First Usable Build — Batch 1, close Phase 4.4.**

Five approved batches:
1. **Batch 1 / Phase 4.4:** storage persistence request, safe IndexedDB save, unknown-field preservation, ST-02/03/04 and independent clean-browser-profile ST-05.
2. **Batch 2 / Phase 5 preparation:** inspect real `layout.js` dependency/import map; extract one narrow `AssetPackApplicationService`; keep this context current. Asset Style Guide may be documented, but do not create sample Packs yet.
3. **Batch 3 / Phase 5:** persistent Pack Registry in IndexedDB; install/enable/disable/uninstall/update UI; `minWorldForgeVersion`; snapshot pinning; Active Tool reset on Pack disable/uninstall; ST-10/11. Manual refresh of pinned assets must be opt-in and confirmed.
4. **Batch 4 / Phase 6:** Asset Pack Studio, batch import, metadata/license/capabilities, image decode validation, `.wfpack` export. Create Natural Terrain and World Symbols sample Packs only after the exporter works.
5. **Batch 5 / Phase 7:** full E2E, offline, save/reopen, `.wforge` export/import and clean-profile acceptance.

Do not start Phase 5 UI before Batch 1 exits. Do not create sample Packs before Phase 6 export. Keep Phase 8–16+ frozen until Phase 7 is complete.

## 2. Verified source entry points

| Path | Observed responsibility / API |
|---|---|
| `src/app.js` | Creates `DatabaseManager`, `ProjectService(database)`, then `UIController(projectService)`; initializes UI on DOMContentLoaded. |
| `src/data/database-manager.js` | IndexedDB database `worldforge-studio`, version 1; stores `projects` and `recentProjects`. Methods include `open`, `request`, `getProject(s)`, `putProject`, `addProject`, `deleteProject`, recent-project CRUD and `deleteProjectAndRecent`. |
| `src/services/project-service.js` | `ProjectService(database)`; create/open/get/list/update/save/duplicate/delete/import; JSON and `.wforge` export/import; schema v2 and v1→v2 migration; validates map, geography, civilization, history and asset snapshots. |
| `src/services/archive-service.js` | ZIP/archive read/write helpers imported by ProjectService. |
| `src/services/project-asset-snapshot-service.js` | Snapshot capture, image byte validation, SHA-256/integrity helpers imported by ProjectService. |
| `src/assets/asset-pack-service.js` | `AssetPackService({registry, loader, worldForgeVersion})`; `inspectPack`, `installPack`, `uninstallPack`, `setPackEnabled`. |
| `src/assets/asset-registry.js` | Pack/asset registry used by AssetPackService. |
| `src/assets/asset-loader.js` | Asset loading/cache/resource lifecycle; passed to AssetPackService for invalidation. Inspect URL ownership before changing revocation behavior. |
| `src/ui/layout.js` | `UIController(projectService)`; currently constructs AssetRegistry, AssetLoader and AssetPackService directly, initializes MapCanvasEngine and wires project workflows. Large controller; no broad rewrite. |
| `tests/assets/` | Asset/archive/image regression tests and browser harnesses. Inspect package scripts and current test layout before adding tests. |

## 3. Observed constraints and cautions

- `package.json`: ES modules, Node >=20; scripts include `npm test`, `npm run test:assets`, `npm run assets:fixture`.
- Project archive limit: 100 MB; project snapshot aggregate limit: 20 MB; individual snapshot file limit: 15 MB (ProjectService).
- Asset Pack import limit: 100 MB; manifest/files are validated before registration.
- IndexedDB currently has `projects` and `recentProjects` stores (DB version 1). Inspected DatabaseManager did not show `navigator.storage.persist()` or dedicated QuotaExceededError UX handling; verify current source before implementation.
- ProjectService spreads top-level project data in validation, but nested service constructors may normalize records. Do not assume unknown nested entity fields survive; add round-trip coverage at project and child-entity levels.
- AssetPackService currently receives an in-memory AssetRegistry from UIController. Persistent Pack Registry is Phase 5 work, not confirmed implemented.
- No broad `layout.js` refactor. Phase 5 preparation is a dependency map plus one narrow `AssetPackApplicationService` boundary.
- Project snapshot bytes must remain pinned across Pack update/disable/uninstall. Render from a verified embedded snapshot first; use current Pack asset only if no snapshot exists or creator explicitly confirms manual refresh.
- Blob URL revocation must not occur while Canvas/UI consumers still hold references. Resource leases/reference tracking belong to Phase 4.4–5 implementation scope; verify existing consumers before changing AssetLoader.
- If a Pack containing the currently active tool is disabled/uninstalled, reset to Select/default safe tool and notify user. Do not delete placed map objects or saved project snapshots.
- Do not change `.wforge` v2 format or storage architecture without a reproduced failure and regression plan.

## 4. Batch 1 — Phase 4.4 implementation scope

Implement and verify:
- Feature-detect `navigator.storage.persist()` during app startup; record/handle the result without claiming guaranteed persistence.
- Safe IndexedDB writes: catch quota/write failures (including `QuotaExceededError`), abort/close the failed transaction safely where applicable, surface a clear message, preserve the previous valid project, and remind users to export backups periodically. Never auto-delete user data to free space.
- Unknown-field preservation through load → edit a known field → save → export/import and v1/v2 migration, including nested layers, map objects and records.
- Independent clean browser profile acceptance: import a `.wforge` v2 archive with no source Pack installed and verify embedded snapshot rendering. Record exact browser/profile evidence. A new tab or clean origin alone is not proof of an independent profile.
- Keep existing archive size/dimension/pixel limits and format compatibility unchanged unless a reproduced defect requires a scoped fix.

Out of Batch 1: Pack Registry/Manager UI, AssetPackApplicationService extraction, Blob URL lease implementation if not required to fix a Phase 4.4 blocker, Phase 6 image-authoring flow, and all Phase 8+ work.

## 5. Six P0 acceptance gates

- **ST-02 QuotaExceededError:** save failure is surfaced; previous stored project remains readable; no automatic deletion.
- **ST-03 Failed save:** failed workflow does not replace the last valid saved version.
- **ST-04 Unknown fields:** unknown project and nested entity fields survive load → edit known field → save → export/import.
- **ST-05 Clean profile:** import `.wforge` v2 without source Pack in a genuinely independent browser profile and render embedded snapshots.
- **ST-10 Version pinning:** Pack update/disable does not silently change bytes used by a saved project.
- **ST-11 Uninstall references:** uninstalling a Pack does not remove snapshots referenced by saved projects.

These are acceptance requirements, not a claim that tests exist or pass. Run the existing suite on the current commit; historical 95/95 is dated 14/11/2026 and must not be reported as current without rerunning.

## 6. Task handoff and retry rules

Every task must state objective, verified current behavior, in/out-of-scope, files to inspect/change, compatibility constraints, acceptance criteria, tests and protected data/behavior. Assign exactly one primary coding agent per task; use a reviewer only when risk warrants it, without parallel edits to the same files.

After at most **3 unsuccessful fix attempts** for the same issue, stop retrying. Report each attempt and its evidence, analyze root cause, list disproven hypotheses and propose the next investigation before further edits.

Agent report must separate: files changed; implementation; commands/tests actually run and results; tests not run; browser/clean-profile evidence; risks/remaining work; commit SHA if committed. Do not equate code written, automated tests, browser acceptance and CI verification.

## 7. Immediate task

**Batch 1 — Phase 4.4:** inspect current code and tests first; establish baseline; implement only storage persistence request, safe-save/quota behavior and unknown-field preservation; add/run ST-02, ST-03, ST-04; execute ST-05 in a genuinely independent clean browser profile if the environment supports it. Do not start Batch 2/Phase 5 work in this task.