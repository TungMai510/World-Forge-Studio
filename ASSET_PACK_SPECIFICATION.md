# WorldForge Asset Pack Specification — v1.0

**Status:** Initial contract for WorldForge Studio Phase 1  
**Archive extension:** `.wfpack`  
**Container:** ZIP STORE (no compression), using the current archive reader  
**Manifest:** `pack.json`

## 1. Principles

- Core is Asset-Pack Agnostic and must not depend on a specific Pack.
- A Pack contains data and image files only. Never execute scripts, HTML, JavaScript or modules from a Pack.
- Canonical asset identity is `<pack-id>::<asset-id>`; local asset IDs need only be unique inside their Pack.
- Categories are contributed by Packs rather than hardcoded as a closed Core list.
- Phase 1 supports PNG, JPEG, WebP and GIF. SVG is deferred until a safe sanitization/rendering policy exists.

## 2. Archive layout

```text
Example-Pack.wfpack
├── pack.json
├── assets/
│   ├── mountains/mountain-small.png
│   └── forests/pine-tree.webp
├── thumbnails/
│   └── MNT-001.webp
├── preview.png       # optional
└── LICENSE.txt       # optional file; manifest license is required
```

Paths are relative to the archive root. Absolute paths, drive paths, backslashes, empty segments, `.`, `..`, control characters and duplicate entries must be rejected.

## 3. Manifest example

```json
{
  "schemaVersion": "1.0",
  "id": "com.worldforge.classic-fantasy",
  "name": "Classic Fantasy",
  "version": "1.0.0",
  "author": "WorldForge",
  "description": "An illustrated fantasy map asset collection.",
  "license": "CC-BY-4.0",
  "compatibility": { "minWorldForgeVersion": "1.0.0" },
  "categories": ["mountains", "forests", "buildings"],
  "assets": [{
    "id": "MNT-001",
    "name": "Small Mountain",
    "category": "mountains",
    "type": "image",
    "file": "assets/mountains/mountain-small.png",
    "thumbnail": "thumbnails/MNT-001.webp",
    "mimeType": "image/png",
    "tags": ["mountain", "nature"],
    "usages": ["stamp", "scatter"],
    "defaultSize": { "width": 180, "height": 140 }
  }]
}
```

Required fields: schemaVersion, id, name, version, author, description, license, compatibility.minWorldForgeVersion, categories and assets. Each asset requires id, name, category, type=image and a file under assets/. Thumbnail, MIME type, tags, usages and default dimensions are optional. The optional `usages` field is a list of up to 20 unique capability strings. Older Packs may omit it; assets without `usages` remain eligible only for generic stamp/decoration placement. Specialized tools must never infer capability from category names. Known Core capabilities are `stamp`, `icon`, `scatter`, `texture-fill`, `pattern-stroke` and `decoration`. Unknown usage strings are preserved as metadata but ignored by Core versions that do not recognize them.

## 4. Identity

Example canonical key: `com.author.pack-name::MNT-001`. Two different Packs may both use `MNT-001`; their Pack namespaces prevent collisions. Pack IDs should be globally unique reverse-domain identifiers.

## 5. Phase 1 security limits

- Maximum archive input and expanded size: 100 MB.
- Maximum entries: 2,000.
- Maximum manifest: 1 MB.
- Maximum individual asset/thumbnail: 15 MB.
- Current ZIP reader supports uncompressed STORE entries only; encrypted and compressed entries are rejected.
- Reject unsafe paths and duplicate ZIP entries; verify image signatures against file extensions.
- No script execution, dynamic module loading, HTML rendering or remote URL loading.
- SVG, fonts, audio, video and executable code are not supported by this schema version.

## 6. Runtime

- AssetPackService inspects and validates before registration.
- AssetRegistry tracks Packs, assets and enabled state in memory.
- AssetLoader creates Blob URLs and maintains a bounded cache.
- Cache object URLs are revoked on eviction, invalidation or clear.
- Disabling a Pack removes its assets from normal lookup without deleting its metadata.
- Phase 1 is in-memory only. IndexedDB persistence, Pack Manager UI, project dependency tracking and .wforge embedding belong to later phases.

## 7. Versioning

Pack version follows Semantic Versioning. schemaVersion is independent of Pack version. Incompatible manifest changes require a new schema version and explicit migration or rejection behavior. minWorldForgeVersion declares the minimum compatible Core version.

## 8. Licensing

Pack authors must hold distribution rights for every included asset. The manifest license field is required; include LICENSE.txt and attribution notices where required. Importing an asset does not grant WorldForge or other users rights beyond the declared license.

## 9. AI-generated asset compatibility (future capability)

AI-generated images are treated as externally generated input, not as a privileged asset type. When AI creation is introduced, every generated file must pass through the same Asset Studio import and Pack validation pipeline as a manually supplied file.

- The Pack schema remains provider/model agnostic; no provider-specific executable payloads or runtime dependencies are permitted.
- Asset provenance may be recorded through optional, forward-compatible metadata or an accompanying provenance record (for example generation source, creation timestamp, model/provider when disclosed, and user-supplied attribution). A future schema revision must define exact fields and privacy implications before standardizing them.
- Required license and attribution fields remain mandatory. An AI model's output does not automatically establish that the user has distribution rights or that a license is valid.
- Generated files must satisfy the same path, file-signature, format, size, entry-count and capability validation rules as all other Pack content.
- AI must not bypass the validator, write directly into an installed Pack, or silently overwrite an existing asset. The user reviews and approves replacements and metadata changes.
- This section records a future compatibility requirement only; it does not add AI support to Pack v1.0 or change the current Asset System implementation priority.
