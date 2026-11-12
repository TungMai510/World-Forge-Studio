# WorldForge Studio — Tool Enhancement Specification


**Status:** Architecture and roadmap specification  
**Date:** 12 November 2026  
**Scope:** Phases 3E–3I (Selection, Brush, River, Landmass, Typography)  
**Related documents:** `ROADMAP_WORLD_FORGE_STUDIO.md`, `TOOL_ASSET_INTEGRATION_SPECIFICATION.md`

---

## 1. Goals and sequencing

This program upgrades the remaining editing tools without replacing the existing map editor or its procedural/vector workflows.

Implementation order:

1. **3E Advanced Selection System** — shared interaction foundation.
2. **3F Brush Tool** — stroke quality and controls.
3. **3G River Tool** — editable curved hydrology.
4. **3H Landmass Tool** — editable coastline geometry.
5. **3I Typography System** — map labels and font control.

Selection comes first because Brush/River/Landmass objects must participate in predictable selection, movement, history, layer guards and export. A shared Path/Vertex Editor should be designed during 3E and reused in 3G/3H.

## 2. Current implementation constraints to respect

- MapCanvasEngine currently centers selection around a single `selectedObjectId`; do not assume multi-selection exists.
- `setSelection(objectId)` and callbacks may be used by existing UI/tools. Preserve compatibility while migrating.
- `deleteObjects(ids)` already exists, but its atomic history behavior and per-layer validation must be inspected before reuse.
- `updateObject(objectId, changes)` is single-object oriented. Multi-object operations need a transaction/batch API rather than repeated updates that create many undo entries.
- Layer groups are not the same as object groups.
- SelectTool, layout selection properties, duplicate/delete actions, object hit testing and viewport coordinate conversion all need coordinated changes.
- Phase 3D.2 image-property UI has been committed but still requires post-fix automated tests and browser verification; do not treat the earlier 76/76 result as verification of that UI patch.

## 3. Phase 3E — Advanced Selection System

### 3.1 Selection state model

Target state:

```js
{
  selectedObjectIds: ["object-a", "object-b"],
  primarySelectedObjectId: "object-a",
  selectionMode: "replace" // replace | add | toggle
}
```

Implementation guidance:
- Store IDs in a Set internally or an ordered unique array with deterministic order.
- Keep `selectedObjectId` as a compatibility alias for the primary selection until all callers are migrated.
- Provide `setSelection(id)`, `setSelections(ids, { primaryId })`, `addToSelection(id)`, `toggleSelection(id)`, and `clearSelection()`.
- Selection-change notifications should expose a normalized selection object. If legacy listeners expect a single object, provide a migration adapter or update all listeners in one controlled change.
- Primary selection drives the existing single-object Properties panel. For multiple selection, show common properties only when a safe shared edit is implemented; otherwise show a count and batch actions.

### 3.2 Marquee gestures

- Pointer down on empty canvas begins a marquee candidate; pointer movement beyond a small screen-space threshold activates the rectangle.
- Convert pointer positions to world coordinates using the same viewport transform used by rendering/hit-testing. Do not compare screen-space rectangles directly with world-space object bounds.
- Left-to-right drag selects objects fully contained by the marquee.
- Right-to-left drag selects objects whose bounds intersect the marquee.
- Shift adds the marquee result to the current selection.
- Ctrl-click / Cmd-click toggles one hit-tested object without clearing the rest.
- Plain click on an object replaces selection; click on empty canvas clears selection unless a modifier is held.
- Escape cancels an active marquee and then clears selection only if no gesture is active.
- Hidden-layer objects are excluded. Locked-layer objects should not be mutated; first release should preferably exclude them from selection to avoid ambiguous affordances.
- Marquee overlay must remain visually stable across zoom and pan and must not become a persisted map object.

### 3.3 Hit testing and bounds

- Reuse each semantic object's world-space bounds where available.
- Define conservative bounds for paths, rotated images, text and terrain polygons.
- For objects without reliable bounds, use geometry-aware intersection rather than a point-only approximation.
- Avoid selecting an object solely because its unrotated axis-aligned box overlaps if a reliable rotated/geometry hit-test exists.
- Test boundary-touch behavior explicitly and document whether edge contact counts as intersection.

### 3.4 Multi-object operations

First release:
- Move selected objects together while preserving relative positions.
- Duplicate selected objects with one consistent world-space offset; preserve all semantic metadata and asset references.
- Delete selected objects.
- Each operation creates exactly one undoable History transaction.
- Validate all affected layers before changing anything. If one selected object is on a non-editable layer, either reject the whole operation with a clear message or apply to the editable subset only if the UI explicitly communicates that behavior. Default: reject atomically.
- Preserve selection after move; after duplicate, select the newly created copies; after delete, clear selection.

Do not add group resize/rotate in the first multi-select release. Heterogeneous geometry requires explicit transforms for paths, polygons, ellipses, text and rotated images.

### 3.5 Persistent groups (later 3E slice)

Temporary multi-selection must not implicitly create a group. Persistent Group/Ungroup requires:
- stable group IDs and parent-child membership;
- nested-group policy (initially no nesting recommended);
- z-order and layer constraints;
- selection and deletion semantics;
- save/load compatibility;
- export that renders children in their original order.

### 3.6 Selection tests and exit criteria

Unit/engine tests:
- single-selection backward compatibility;
- replace/add/toggle/clear and primary selection;
- marquee containment vs intersection;
- viewport zoom/pan conversion;
- rotated image/path/polygon bounds;
- hidden and locked layer policy;
- move/duplicate/delete atomicity;
- one history entry per batch and correct Undo/Redo;
- stale IDs and object deletion during selection.

Browser QA:
- mouse drag both directions;
- Shift marquee and Ctrl/Cmd-click;
- selection while zoomed and panned;
- move/duplicate/delete 2–5 mixed object types;
- locked/hidden layer guard;
- Undo/Redo after each batch operation.

Exit: all above pass, no regression in existing single-object Select/Properties workflows.

## 4. Shared Path/Vertex Editor foundation

Before River and advanced Landmass editing:
- define a common path geometry representation with nodes, incoming/outgoing handles and closed/open state;
- define commands for insert node, delete node, move node, change handle mode and close/open path;
- keep geometry in world coordinates;
- make edits history-aware and batchable;
- provide renderer-independent geometry utilities for bounds, hit tests and SVG path serialization;
- preserve legacy path/polygon schemas through adapters or migrations.

Do not force every tool into a Bézier schema if its current semantic representation is different; adapters should retain source data and round-trip accurately.

## 5. Phase 3F — Brush Tool Enhancement

### 5.1 Scope
- Smooth freehand strokes while retaining editable vector geometry.
- Brush size, opacity and hardness/edge falloff.
- Presets: Basic, Soft, Ink/Calligraphy (only if supported by current renderer).
- Eraser remains a distinct semantic action or existing eraser workflow; do not silently convert brush strokes to destructive raster edits.
- Optional pressure input may be added later with mouse fallback.

### 5.2 Data and rendering
- Store sampled points and normalized stroke settings on the path object.
- Smoothing must be deterministic and avoid overshooting corners unexpectedly.
- Width/opacity interpolation should be defined for each segment.
- Textured brushes are deferred until seeded stamp placement is available. Store seed and parameters, not only a sequence of untraceable random placements.
- Canvas and SVG exports must reproduce stroke width, opacity and caps/joins as closely as possible.

### 5.3 Tests
- tap/dot, short stroke, fast stroke, long stroke, pointer cancel;
- smoothing preserves endpoints and reasonable corners;
- size/opacity/hardness boundaries;
- zoom-independent world width behavior;
- hit-test/bounds and export parity;
- undo/redo creates one entry per completed stroke.

## 6. Phase 3G — River Tool Enhancement

### 6.1 Semantic model
Represent a river as editable path segments. Suggested metadata:

```js
{
  feature: "river",
  riverSystemId: "stable-system-id",
  parentSegmentId: null,
  geometry: { nodes: [] },
  widthProfile: [
    { position: 0, width: 2 },
    { position: 0.5, width: 5 },
    { position: 1, width: 12 }
  ],
  style: { color: "#...", opacity: 1, outline: null }
}
```

This is illustrative; adapt to existing object schemas rather than replacing them blindly.

### 6.2 Editing and styling
- Smooth curve creation and node/tangent editing.
- Width profile from source to downstream; define interpolation and minimum/maximum widths.
- Tributaries are separate path segments linked by `riverSystemId` and optional `parentSegmentId`.
- Style controls: fill/color, opacity, outline, optional texture-fill asset.
- Maintain a clear direction convention (source to mouth) for width and flow-related metadata.
- Preserve simple legacy river drawing as the default creation path until the advanced editor is stable.

### 6.3 Rendering/export
- Use a consistent stroke expansion algorithm for variable-width paths.
- Hit testing should use rendered stroke geometry or a documented tolerance.
- Selection bounds include the widest river section.
- Canvas, SVG, PNG and PDF output should agree; texture fallback must be defined when an asset is missing.

### 6.4 Tests
- curve geometry, width interpolation, branching links, invalid/cyclic parent references;
- bounds and hit testing at source/middle/mouth;
- node editing history;
- texture missing fallback;
- Canvas/SVG export and browser interaction.

## 7. Phase 3H — Landmass Tool Enhancement

### 7.1 Geometry editing
- Vertex selection, insertion on edge, deletion and movement.
- Smooth coastline controls using curves or a controlled smoothing adapter.
- Preserve closed polygon validity and minimum vertex count.
- Keep the existing polygon creation tool as a fallback.

### 7.2 Procedural coastline
Store source polygon plus parameters:
- deterministic seed;
- amplitude;
- frequency/scale;
- smoothing level.
Generation must be reproducible. Users must be able to disable or adjust the procedural effect without losing the source coastline.

### 7.3 Islands and topology
- Add island presets and repeatable generation after core polygon editing.
- Merge/split is deferred pending a vetted offline polygon-boolean dependency, license review, hole/multipolygon policy and robust topology tests.
- Do not approximate polygon boolean operations with ad-hoc point clipping.

### 7.4 Tests
- vertex insertion/deletion and minimum polygon constraints;
- closed-ring validity and self-intersection policy;
- deterministic seed output;
- bounds/hit test after smoothing;
- Undo/Redo and export;
- browser QA at different zoom levels.

## 8. Phase 3I — Typography System

### 8.1 Local font architecture
- Font assets are local and bundled with the app or explicitly installed by the user; runtime must not require Google Fonts/CDN.
- Maintain a font registry with stable family IDs, display names, file references, supported weights and license/attribution.
- Ensure Vietnamese glyph coverage (including combining marks and precomposed forms) and test fallback behavior.
- Prefer well-supported open font families with clear licenses; final font shortlist requires license and glyph review before bundling.

### 8.2 Text object properties
- family, size, weight, style;
- letter spacing and line height;
- alignment and optional vertical alignment;
- fill/color, opacity, outline and optional shadow;
- label preset and optional semantic feature (country, region, city, capital, mountain, river, sea/ocean, point of interest).

### 8.3 Rendering and editing
- Keep text editable as text objects.
- Define font loading readiness before measuring bounds or exporting.
- Recompute selection bounds when font metrics change.
- Missing fonts fall back predictably and show a non-destructive warning.
- Straight text is first release. Curved text is deferred until SVG textPath and Canvas glyph-by-glyph rendering can be made visually consistent.
- Font files and attribution must be included in application distribution; project embedding/subsetting policy belongs to Persistence/Export design.

### 8.4 Tests
- Vietnamese diacritics and combining sequences;
- font missing/loading/fallback;
- weight/style fallback;
- bounds and hit testing with different fonts;
- line-height/letter-spacing/alignment;
- Canvas/SVG export and offline startup;
- browser QA on Windows.

## 9. Cross-cutting non-functional requirements

- Local-first/offline; no mandatory external service.
- No executable code inside Asset Packs.
- Document font/image licenses and attribution.
- Keyboard accessibility and clear focus states.
- No hidden mutation of locked layers.
- Deterministic procedural output where seeds are used.
- Semantic objects remain editable; avoid flattening to raster as a shortcut.
- Automated tests must be run on the relevant commit; browser QA must be explicitly reported by the repository owner before a phase is marked complete.

## 10. Suggested implementation slices

| Slice | Deliverable |
|---|---|
| 3E.1 | Selection state API + marquee overlay + direction-based selection |
| 3E.2 | Multi-move/duplicate/delete + atomic history |
| 3E.3 | Shared Path/Vertex Editor primitives and optional persistent groups |
| 3F.1 | Brush smoothing + size/opacity |
| 3F.2 | Hardness/presets + export parity |
| 3F.3 | Seeded texture brush, only after deterministic stamping |
| 3G.1 | River curve geometry + width profile |
| 3G.2 | Node/tangent editing + tributary relationships |
| 3G.3 | River styles, texture and export |
| 3H.1 | Landmass vertex editing |
| 3H.2 | Smooth coastline + deterministic noise |
| 3H.3 | Island presets; merge/split only after dependency approval |
| 3I.1 | Local font registry + Vietnamese support |
| 3I.2 | Text Properties panel + label presets |
| 3I.3 | Advanced typography/export; curved text later |

