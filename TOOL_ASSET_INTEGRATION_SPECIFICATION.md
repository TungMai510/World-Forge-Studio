# WorldForge Studio — Tool–Asset Integration Specification

**Status:** Active implementation specification — Phase 3C.1–3C.4 verified; next: Phase 3D  
**Date:** 12/11/2026  
**Applies to:** WorldForge Core, Map Editor, Tool System, Asset Runtime and Asset Packs  
**Related:** ASSET_PACK_SPECIFICATION.md, ROADMAP_WORLD_FORGE_STUDIO.md

---

## 1. Purpose

## Phase 3C implementation log

### 3C.1 — Icon Tool (in progress)

- The Asset Library can apply an `icon`-capable image to the active Icon Tool.
- IconTool continues to create semantic `type: 'icon'` map objects; it stores the namespaced `assetRef` rather than converting the icon into a generic image object.
- CanvasLayerRenderer delegates asset-backed icon drawing to ImageObjectRenderer, preserving the existing vector icon fallback when no asset is selected.
- Automated coverage is added for vector fallback, semantic object creation and renderer delegation.
- Terrain, Lake and Border remain browse-only until their own semantic rendering/placement adapters and tests are implemented. A shared BaseTool selection state alone is not considered completed integration.


This document defines how existing map tools consume resources supplied by installed Asset Packs.

The current prototype has two separate paths:

1. Existing tools such as Landmass, Terrain/Mountain, River, Lake, Border and Icon create vector/geometric map objects.
2. Asset Pack Runtime loads images, while PlaceAssetTool places them as standalone Image Objects.

These paths must converge. An Asset Pack is not merely a source of images for a separate Place Asset command. It is a shared resource library available to every compatible map tool.

This document is an architecture contract and roadmap. It does **not** claim that the integrations described below are already implemented.

## 2. Product principles

1. **Tool-first workflow:** users stay in the tool they are using and select compatible assets in context.
2. **Asset-Pack Agnostic Core:** Core must not depend on a specific Pack, author, visual theme or closed category list.
3. **Procedural and asset-backed modes coexist:** every existing vector/procedural workflow remains available without an installed Pack.
4. **Semantic map objects:** tools create objects that represent map concepts (terrain, lake, border, icon, etc.), not indiscriminately generic images.
5. **One asset, multiple usages:** a source asset may support more than one usage, if its metadata declares those capabilities.
6. **Capability-based filtering:** tools request capabilities; they must not infer compatibility from category names or filenames.
7. **Data-only Packs:** Pack files never execute scripts or arbitrary code.
8. **Local-first:** selection, rendering and editing work offline after the Pack is installed.
9. **Project durability:** projects must retain the visual content they depend on even if a Pack is later disabled, updated or removed.
10. **Incremental migration:** existing tools and saved maps must keep working while integration is introduced tool by tool.

## 3. Four distinct concepts

| Concept | Responsibility | Example |
|---|---|---|
| Asset | Original resource and metadata supplied by a Pack | A mountain illustration PNG |
| Asset Usage / Capability | Declares supported ways to consume the resource | stamp, scatter, texture-fill |
| Tool Binding / Adapter | Connects a tool to compatible assets and translates selection into tool state | Terrain tool requests mountain stamps |
| Map Object | Persistent object placed or drawn on the map | A terrain region containing asset-backed mountain stamps |

Do not conflate a Pack category with a usage capability. A category such as mountains helps organize content; a capability such as stamp or texture-fill defines what a tool can do with it.

## 4. Target architecture

~~~text
Asset Pack (.wfpack)
       |
       v
Pack Validator -> Asset Registry -> Asset Loader
                                      |
                                      v
                               Shared Asset Library
                                      |
                         selected asset + metadata
                                      |
                                      v
                              Tool Binding API
                                      |
                 +--------------------+--------------------+
                 |                    |                    |
              Icon Tool          Terrain Tool           Lake Tool
                 |                    |                    |
           semantic icon        terrain + assetRef     lake + assetRef
                 |                    |                    |
                 +--------------------+--------------------+
                                      |
                              Map Object Model
                                      |
                            Renderer / Export /
                         History / Persistence
~~~

The Shared Asset Library is a reusable UI component. It can appear as a docked panel, contextual drawer or selection dialog, but the UI must receive its filter and selection contract from the active tool.

### 4.1 Core responsibilities

- Asset Registry answers which assets are installed and enabled.
- Asset Loader resolves the bytes/URL and manages cache lifecycle.
- Shared Asset Library presents assets and forwards a selected asset reference.
- Tool Binding declares supported capabilities and converts the selection into validated tool options.
- Tool creates or modifies the correct semantic map object.
- Renderer understands the semantic object and its asset-backed rendering mode.
- Project Persistence preserves references and embedded fallback data.

No tool should parse wfpack files directly. No Pack should contain tool-specific JavaScript.

## 5. Capability and metadata model

### 5.1 Initial capability vocabulary

The following vocabulary is proposed for the Core contract. It is intentionally independent from Pack categories.

| Capability | Meaning | Candidate tools |
|---|---|---|
| stamp | Place a single image instance | PlaceAsset, Icon, Terrain |
| icon | Place a map symbol with icon semantics | Icon |
| scatter | Distribute repeated instances along an area/path | Terrain, Brush, later River/Landmass |
| texture-fill | Fill a closed shape or region with a texture | Lake, Landmass, Terrain |
| pattern-stroke | Repeat or tile an asset along a path | Border, River |
| decoration | Place non-semantic decorative artwork | PlaceAsset |

This list is extensible. Unknown capability strings must be safely ignored by older Core versions; they must not cause arbitrary code execution.

### 5.2 Backward compatibility

The Asset Pack v1.0 manifest is extended with an **optional** `usages` string array. This is additive: existing v1 Packs remain valid without changes.

- Existing Pack v1 assets without `usages` remain eligible only for generic stamp/decoration placement.
- Specialized tools must not infer compatibility merely because a category is named `mountains`, `lakes` or `icons`.
- The validator accepts up to 20 unique non-empty usage strings (maximum 40 characters each). Core recognizes the capability vocabulary defined above; unknown strings are preserved as metadata and ignored by Core versions that do not recognize them.
- A present empty `usages: []` means the asset has no declared supported usage; it does not receive the legacy generic fallback.
- The field is descriptive data only. It cannot name a module, script, callback or executable handler.

Example:

~~~json
{
  "id": "MNT-001",
  "name": "Small Mountain",
  "category": "mountains",
  "type": "image",
  "file": "assets/mountains/mountain-small.png",
  "usages": ["stamp", "scatter"],
  "tags": ["mountain", "snow", "rock"],
  "defaultSize": { "width": 180, "height": 140 }
}
~~~

### 5.3 Tool-side query contract

A tool should declare a query in terms of capabilities and optional semantic hints, for example:

~~~js
{
  capabilities: ["icon", "stamp"],
  categories: [],             // optional preference, not a compatibility rule
  tags: ["city", "capital"],  // optional semantic hints
  acceptedTypes: ["image"]
}
~~~

The query contract must distinguish:
- required capabilities (must match);
- optional category/tag filters (help browsing);
- supported file/resource types;
- optional tool-specific constraints (e.g. aspect ratio or animation policy).

Core must not embed official Pack category names as required filters.

## 6. Tool integration requirements

### 6.1 Icon Tool — first integration candidate

Current behavior: places a built-in type=icon object using an icon key, size and color.

Target behavior:
- Preserve built-in icon choices as a fallback.
- Add an Asset Library selection mode for assets declaring icon capability (or approved legacy stamp assets in a clearly identified generic section).
- Store an asset reference on an icon-semantic object or use a versioned asset-backed icon object schema.
- Support size, rotation and opacity where meaningful.
- Keep selection, hit testing, duplicate/delete, Undo/Redo and export behavior consistent.

Do not replace the current icon tool with PlaceAssetTool.

### 6.2 Terrain / Mountain Tool

Current behavior: TerrainTool derives from PolygonTool and defaults its terrain feature to mountain.

Target behavior:
- Preserve procedural polygon drawing and existing terrain metadata.
- Add a choice between procedural/vector mode and asset-backed mode.
- Asset-backed mode can place individual mountain stamps or, in a later iteration, scatter a selected asset along a user-drawn path/region.
- If the user draws a terrain region and applies a texture, the saved object remains a terrain region with an asset reference and rendering parameters; do not flatten it into a generic image.
- Define deterministic placement/spacing and seeded randomness before implementing Scatter so maps remain reproducible.

### 6.3 Lake Tool

Current behavior: creates an ellipse with feature=lake.

Target behavior:
- Preserve the ellipse/vector mode.
- Add optional texture-fill mode for closed lake geometry.
- Keep lake geometry editable independently from the texture.
- Define clipping, scale, rotation, repeat/tile behavior and export consistency.
- Do not implement texture fill by placing a rectangular image over the lake.

### 6.4 Border Tool

Current behavior: creates a path with feature=border, stroke and dash settings.

Target behavior:
- Preserve simple vector stroke and dash controls.
- Add optional pattern-stroke mode using compatible assets.
- Repeat/tile the selected pattern along path length with stable spacing and phase.
- Maintain path editing and correct bounds/hit testing.
- Do not turn a patterned border into a sequence of unrelated generic image objects unless a specific placement mode requires that representation.

### 6.5 River, Landmass and Brush — later integrations

- River may use pattern-stroke or texture/flow styles after Border's path rendering contract is proven.
- Landmass may support texture-fill after Lake's closed-shape implementation is proven.
- Brush may support scatter/texture brushes after deterministic scatter and stroke history are implemented.
- These are later extensions, not part of the first integration milestone.

### 6.6 PlaceAssetTool

Keep PlaceAssetTool as the generic, free-placement tool for stamps and decorations. It remains useful when the user wants to place an arbitrary asset without invoking a specialized semantic tool.

It must not become the mandatory route for Icon, Mountain, Lake or Border asset workflows.

## 7. Map object and rendering design

Do not force all asset-backed content into type=image.

The implementation should evolve toward versioned semantic objects or versioned rendering properties, for example:

- icon-semantic object with an optional assetRef;
- terrain region with optional asset-backed stamp/texture mode;
- lake geometry with optional texture-fill reference;
- border path with optional pattern-stroke reference;
- generic image object for free stamps/decorations.

The exact schema is an implementation decision to be made in Phase 3A. Before coding, document:
1. schema version and migration behavior;
2. how assetRef stores Pack ID, asset ID and Pack version;
3. embedded fallback reference for project portability;
4. transform/render parameters;
5. renderer and SVG/Canvas/PDF export behavior;
6. hit testing and selection bounds;
7. copy/duplicate and Undo/Redo semantics.

Rendering should be composable: semantic geometry owns its shape; an asset-aware fill/stroke/stamp renderer supplies its visual appearance. Avoid embedding Pack-specific drawing logic in individual tools.

## 8. Shared Asset Library UX

The Asset Library is one reusable component, not a separate library implementation per tool.

It should support:
- thumbnail grid/list and loading/error placeholders;
- search by display name, ID and tags;
- filter by installed Pack and category;
- filter by required capability supplied by the active Tool Binding;
- clear indication of which Pack/version an asset comes from;
- disabled Pack and incompatible asset states;
- selection preview and relevant tool settings;
- keyboard navigation and accessible labels;
- empty state explaining how to install/import a Pack.

Contextual examples:
- Icon Tool asks for icon assets.
- Terrain/Mountain asks for stamp and later scatter.
- Lake asks for texture-fill.
- Border asks for pattern-stroke.

A user may still open the complete Asset Library independently for browsing, but selecting an asset should only activate actions supported by that asset's declared capabilities.

## 9. Integration sequence

### Phase 3A — Tool–Asset Integration Contract

1. Inspect all current tool classes and object schemas.
2. Define capability vocabulary and backward-compatible manifest evolution.
3. Define Tool Binding API and asset selection state lifecycle.
4. Define semantic object references and renderer extension points.
5. Add unit tests for capability matching, unsupported capabilities, disabled Packs and invalid/stale references.
6. Do not build the full Asset Library UI yet.

**Exit criteria:** architecture/schema decision documented; contract tests pass; existing vector-only tools still work unchanged.

### Phase 3B — Shared Asset Library

1. Implement a reusable library component/module outside the monolithic UI controller where practical.
2. Connect it to Asset Registry/Loader through a narrow API.
3. Accept a query from the active Tool Binding.
4. Return a selected asset reference to that binding.
5. Add thumbnail, search, Pack/category filters, loading/error/empty states.

**Exit criteria:** same library component can serve at least two tools with different capability filters; no tool-specific Pack parser or duplicate library code.

### Phase 3C — Specialized tool integrations

Implement in this order:

1. Icon Tool — asset-backed icon selection and placement.
2. Terrain/Mountain — asset stamps while retaining procedural polygon mode.
3. Lake — texture fill while retaining ellipse/vector mode.
4. Border — patterned stroke while retaining ordinary vector stroke.

Each tool must have unit tests, renderer/export tests and browser QA. Do not proceed to the next tool if the current integration breaks its procedural fallback or existing project compatibility.

### Phase 3D — Generic and advanced placement

1. Complete generic PlaceAsset stamp workflow.
2. Add scatter only after deterministic seeded placement and grouped Undo/Redo are designed.
3. Add Brush texture/scatter only after scatter is stable.
4. Add River and Landmass advanced visual styles after the common renderer contracts are proven.

### Phase 4 — Persistence and archive

Persist semantic objects and references. Embed/snapshot the assets actually used by a project. Verify that disabling, updating or uninstalling a Pack does not silently break an existing project.

## 10. Quality and acceptance criteria

The integration is not complete until all applicable checks pass:

- Existing vector/procedural tools work without any Asset Pack installed.
- Installing a new Pack makes compatible assets discoverable without changing Core code.
- A tool only offers assets matching its required capability.
- Pack category names are not treated as a closed Core enum.
- Selecting an asset in a specialized tool creates the correct semantic object, not an unrelated generic image.
- Asset references survive move, resize, rotate, duplicate, delete, Undo and Redo as applicable.
- Disabling/uninstalling a Pack produces a clear missing-asset state and never crashes the Canvas.
- Project save/export/import preserves visual output with Pack unavailable.
- Canvas and all supported export formats render the same asset-backed appearance within documented limitations.
- Browser QA verifies actual interaction, not only module/unit tests.
- No test pass is claimed until it has been run on the corresponding commit.

## 11. Explicit non-goals for the first integration

- No Pack-provided JavaScript or executable plugins.
- No marketplace or remote Pack download service.
- No cloud dependency for browsing installed assets.
- No automatic conversion of every old vector object into an image.
- No removal of the existing vector tools.
- No requirement that every asset support every capability.
- No full scatter/texture brush system before the first four specialized tool integrations are stable.

## 12. Implementation status at publication

The repository currently contains Asset Pack validation/registry/loader, Image Object rendering, PlaceAssetTool and the legacy vector tools. The shared Tool Binding API, contextual Asset Library, and asset-backed workflows for Icon, Terrain/Mountain, Lake and Border are **not yet implemented**.

This specification records the agreed direction. The next code change should begin with Phase 3A and its contract tests, not with another isolated UI feature.

## 13. Phase 3A implementation update — 12/11/2026

The first Tool–Asset contract implementation has been committed:

- Added `src/assets/tool-asset-capabilities.js` with a finite Core capability vocabulary, query normalization, required/all-of and any-of matching, and `ToolAssetBinding`.
- Added per-tool binding declarations to `ToolManager`: Icon requires `icon`; Terrain requires `stamp`; Lake requires `texture-fill`; Border requires `pattern-stroke`; generic Place Asset accepts `stamp` or `decoration`.
- Legacy Pack assets without `usages` are eligible only through the explicitly opted-in generic Place Asset binding. Specialized tools do not infer compatibility from categories or receive legacy fallback.
- Added optional `usages` metadata to the v1.0 Pack validator and specification. It is descriptive data only; unknown capability strings are preserved but ignored by Core.
- Added `BaseTool.setAssetSelection` as the common selection contract and a PlaceAssetTool adapter that applies the resolved reference and Pack default dimensions.
- Exposed Asset Registry injection through `MapCanvasEngine.setAssetRegistry`; UIController now supplies the same registry used by AssetPackService and AssetLoader to ToolManager.
- The existing Pack import flow now queries the generic tool binding and routes the chosen asset through `selectAssetForTool`, rather than bypassing the binding with direct tool options.

**Current boundary:** this establishes the runtime contract and connects the existing generic Place Asset flow. Icon, Terrain, Lake and Border still do not consume asset selections to create their semantic map objects; that work belongs to Phase 3C. The contextual Shared Asset Library belongs to Phase 3B.

**Verification:** new automated tests cover capability validation/matching, optional metadata compatibility, per-tool filtering, stale Pack versions, disabled Packs, selection routing and generic fallback. These tests have been committed but have **not yet been run by the user on the latest checkout**. Phase 3A remains In Progress pending local test execution and review.


## Phase 3B — Shared Asset Library implementation update (12/11/2026)

The first shared Asset Library UI is now implemented in the editor:

- Added a single Asset Library dialog reachable from the top navigation and the Place Asset tool.
- Replaced the old numeric `prompt()` asset picker with a visual grid of compatible assets and image previews.
- Added search across asset name, ID, Pack name, description and tags; category and Pack filters; and a selected-asset detail preview.
- Added in-session Pack management: import `.wfpack`, enable/disable and uninstall. Disabling or uninstalling a Pack invalidates its loaded URLs and clears tool selections that reference that Pack.
- The asset grid queries ToolManager's active-tool binding, so changing the active tool changes the compatibility-filtered collection. Tools without a binding show an explicit unsupported state. Specialized tools may browse compatible candidates, but the apply action remains gated until Phase 3C.
- Asset application is currently enabled only for the integrated Place Asset workflow. Icon, Terrain, Lake and Border can already expose their contract-filtered candidates, but applying assets to their tools is deliberately gated until their semantic integration in Phase 3C.
- Added a pure Asset Library filtering model and automated tests for search, combined category/search filters, disabled assets and category enumeration.

**Known boundaries:** Pack installation and enabled state are session-only; IndexedDB persistence and project asset snapshots belong to later persistence/Pack Manager work. The dialog is a first usable shared library, not yet a dedicated dockable panel. Browser QA and full `npm test` are pending on the owner's checkout.


## Phase 3C.1 — Icon Tool integration verified (12/11/2026)

- IconTool stores the selected namespaced Asset Pack reference on a semantic `icon` map object; the existing vector icon remains the fallback when no asset is selected.
- CanvasLayerRenderer delegates asset-backed icon drawing to ImageObjectRenderer.
- Shared Asset Library allows applying a compatible asset to Icon Tool.
- The Classic Fantasy QA Pack now includes `ICO-001` Castle Icon with `usages: ["icon"]`.
- The repository owner confirmed the fixture regeneration and Icon Tool browser test completed successfully.

## Phase 3C.2 — Terrain/Mountain integration in progress

- TerrainTool will retain its existing polygon-area workflow when no asset is selected.
- When a compatible `stamp` asset is selected, a click places a centered Image Object using the Pack's `defaultSize` and namespaced asset reference.
- The shared Asset Library apply action is enabled for Terrain.
- Unit coverage is being added for vector fallback, semantic image-stamp creation and renderer delegation. Local test and browser verification remain pending until the owner pulls this commit.


## Phase 3C.3 — Lake Tool texture fill (in progress)

- LakeTool retains its existing solid-color ellipse when no texture asset is selected.
- A selected `texture-fill` asset reference is stored on the lake object as `textureAssetRef`.
- CanvasLayerRenderer requests the texture image from ImageObjectRenderer and repeats it inside the ellipse clip; the existing lake outline is drawn above it.
- Classic Fantasy QA fixture adds `WTR-001` Lake Water Texture with `usages: ["texture-fill"]`.
- Unit coverage and browser verification are pending on the owner’s local checkout.


## 14. Phase 3C.4 — Border Tool pattern-stroke (completed)

- Border Tool now accepts assets declared with `pattern-stroke` through the existing ToolAssetBinding. The original dashed vector workflow remains unchanged when no pattern is selected.
- A patterned border remains a semantic `type: 'path', feature: 'border'` object. It stores `patternAssetRef`, source `patternSize` and `patternScale`; it is not flattened into unrelated image objects.
- CanvasLayerRenderer repeats the loaded pattern image along each path subpath, samples positions at even intervals, rotates each tile to the local segment tangent, and retains the vector stroke underneath as a loading/missing-image fallback.
- Patterned-border selection bounds are expanded to include artwork around the path centerline. Existing path hit testing remains based on the semantic path and stroke tolerance.
- The Classic Fantasy QA Pack fixture now includes `BND-001 Stone Border Pattern` with `usages: ['pattern-stroke']`.
- Asset Library selection is enabled for Border Tool and displays a context-specific instruction after selection.
- Automated coverage added for vector fallback, semantic reference metadata, repeated/rotated rendering and expanded bounds.

**Verification status: completed.** The user confirmed that Phase 3C.4 testing is complete. GitHub Actions run #102 completed successfully, including both Asset Foundation tests and all prototype tests. Browser QA and user-facing export checks are confirmed by the user.


### Export compatibility note for Phase 3C.4

- Canvas-based PNG/JPG/PDF export preloads border pattern references before rendering.
- SVG export embeds the pattern image as a data URI and emits repeated, tangent-rotated SVG image tiles along the semantic path.
- Export coverage includes a focused SVG regression test. Browser QA for the user-facing export formats has been confirmed complete by the user.


## 15. Phase 3D.1 — Generic Place Asset placement

The generic Place Asset workflow now supports two placement gestures:
- Click: place at the Pack asset's `defaultSize`, centered on the pointer.
- Drag: use the pointer-down and pointer-up world coordinates as a custom bounding rectangle.

The Place Asset toolbar exposes default width and height, rotation, opacity, and image fit (`contain`, `cover`, `fill`). These settings are copied onto the created semantic image object along with its namespaced `assetRef`. Placement is rejected if no asset is selected or the active layer is hidden/locked.

Automated tests cover click placement, drag bounds, transform metadata and invalid state/options. The test file is committed; local `npm test` and manual browser QA remain pending. See `worldforge_ui_prototype/tests/assets/README.md`.


## Phase 3D.2 — Selected Image Object property editing

The Place Asset toolbar configures defaults for newly placed assets. Editing an existing image is handled separately in the Properties panel after selecting it with Select Tool. The panel exposes width, height, rotation, opacity and fit; submitting updates the selected object through the engine's normal object-edit/history path. This keeps creation defaults separate from per-object properties.


---

## 16. Tool Enhancement Program — phases 3E–3I

The next tool work is organized around shared editing foundations rather than isolated tool-specific UI patches. The detailed contracts, data models, gestures, test matrix and exit criteria are maintained in `WORLD_FORGE_TOOL_ENHANCEMENT_SPECIFICATION.md`.

### 16.1 Phase 3E — Advanced Selection System

- Evolve the current single-object selection into a multi-selection model with `selectedObjectIds` and a primary selected object. Preserve `setSelection(id)` as a backward-compatible wrapper.
- Add `setSelections(ids)`, additive/toggle selection operations, selection clear, and a stable selection-change payload.
- Implement marquee selection in world coordinates after applying the viewport transform:
  - left-to-right drag: fully contained objects;
  - right-to-left drag: intersecting objects;
  - Shift: additive selection;
  - Ctrl/Cmd-click: toggle one object.
- Exclude objects on hidden layers. Locked-layer objects may be inspectable/selectable only if the UI clearly prevents mutation; default first release may exclude them for predictable behavior.
- Add multi-object move, duplicate and delete. Each bulk operation must be one history transaction, preserve object geometry/metadata and validate every affected layer before mutation.
- First release focuses on selection, move, duplicate and delete. Multi-resize/rotate and persistent Group/Ungroup are later 3E slices, not prerequisites.
- Existing `deleteObjects(ids)` may be reused after verifying atomic history and layer validation. Current engine single-ID assumptions in SelectTool, MapCanvasEngine and layout must be migrated deliberately.

### 16.2 Phase 3F — Brush Tool

- Keep editable vector stroke geometry as the source of truth.
- Add smoothing with a deterministic algorithm, size, opacity, hardness/edge falloff and a small set of clear presets.
- Pressure sensitivity is optional and must degrade gracefully to constant-width mouse input.
- Textured brush/stamping is deferred until seeded deterministic placement and grouped undo are available.
- Preserve current brush behavior as a default preset and test pointer cancellation, short taps, fast strokes, zoom/pan and export.

### 16.3 Phase 3G — River Tool

- Model rivers as editable path segments with nodes and curve handles, not a baked bitmap.
- Support smooth curves, node/tangent editing, width profile (source, middle, downstream), color/opacity/outline and optional texture.
- Represent tributaries as linked segments using stable `riverSystemId` and optional `parentSegmentId`; avoid forcing branching topology into a single path object.
- Use a shared Path/Vertex Editor where possible; keep the existing simple river workflow as a compatible default.
- Define Canvas, hit-test, selection bounds and SVG/PNG/PDF export behavior for variable-width curves.

### 16.4 Phase 3H — Landmass Tool

- Add editable vertices, insertion/deletion, smooth coastline controls and seeded coastline noise.
- Preserve base polygon points and procedural parameters (seed, amplitude, frequency/scale) so users can regenerate or reduce effects without losing the original geometry.
- Add island-generation presets and style controls after editing foundations.
- Polygon merge/split is explicitly deferred until a robust offline polygon-boolean implementation, dependency/license review and topology tests are approved.
- Keep existing polygon creation behavior available.

### 16.5 Phase 3I — Typography System

- Add local font-family registration and a font fallback stack; no runtime dependency on remote font CDNs.
- Font choices must include Vietnamese glyph coverage and documented open-font licenses/attribution.
- Text object properties: family, size, weight, style, letter spacing, line height, alignment, fill, opacity, outline and optional shadow.
- Add semantic label presets for empire/country, region, city/capital, mountain range, river, sea/ocean and point-of-interest.
- Ensure font loading lifecycle, missing-font fallback, hit testing, selection bounds and Canvas/SVG export parity.
- Curved text is a later slice after straight text styling and export are stable; Canvas glyph placement and SVG textPath must be tested separately.

### 16.6 Cross-phase acceptance requirements

- Existing maps and vector-only workflows remain usable without Packs.
- New geometry remains editable after save/reopen (once Phase 4 persistence is implemented).
- All multi-object edits are atomic in History and respect hidden/locked layers.
- Pointer gestures work at different zoom levels and while the canvas is panned.
- Tests cover model/engine, renderer, export and browser interactions.
- Local-first/offline behavior and asset/font licensing are documented.
- Do not mark a phase complete based only on committed code; require automated tests and browser QA appropriate to the feature.
