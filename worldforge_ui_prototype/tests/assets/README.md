# Asset Foundation and Image Renderer tests

Requires Node.js 20 or newer. No third-party test dependencies are required for the test suite.

From `worldforge_ui_prototype/`:

```bash
npm run assets:fixture
npm run test:assets
npm test
```

The fixture generator creates `tests/assets/fixtures/classic-fantasy.wfpack` using the application's ZIP writer. The Pack contains four generated, valid PNG images: a 96×64 mountain stamp (`MNT-001`), a 64×96 forest image, a 64×64 castle icon (`ICO-001`) declared with `usages: [\`icon\`]`, and a 48×48 repeating water texture (`WTR-001`) declared with `usages: [\`texture-fill\`]`. The icon uses a transparent background and a simple castle emblem. These are technical QA illustrations, not production art. The sample manifest uses CC0-1.0 for the generated fixtures.

The test suite verifies ZIP round-trip, manifest validation, path traversal rejection, unsupported archive content rejection, image signature checking, minimum Core compatibility, Pack registration and namespace identity, duplicate installation rejection, enabled/disabled behavior, Blob URL loading, cache eviction/revocation, image object schema, geometry/hit testing, renderer fit behavior, lifecycle invalidation, and SVG image embedding.

The validator currently checks image signatures, not full image decoding or decompressed pixel limits. Production hardening should decode images in a browser worker or trusted image decoder and enforce pixel/dimension limits before accepting untrusted Packs.

## Phase 2 browser verification harness

The manual browser harness is development-only. It uses the real Asset Pack parser, registry, loader, MapCanvasEngine, image renderer and map export service; it does not add features to the production UI.

1. From `worldforge_ui_prototype/`, regenerate the QA Pack:
   ```powershell
   npm run assets:fixture
   ```
2. Start a local static server from this directory (Node.js is sufficient; Python is not required):
   ```powershell
   npx --yes http-server . -p 8000 -c-1
   ```
3. Open `http://localhost:8000/tests/assets/image-renderer-browser.html`.
4. Select `tests/assets/fixtures/classic-fantasy.wfpack` in the file picker.
5. Add the mountain and forest images. Confirm their different aspect ratios are visible and wait for image decode.
6. Add a second copy and verify the topmost image is selected first; drag each image to verify world-space movement.
7. Change width, height, rotation, opacity and fit mode (`contain`, `cover`, `fill`), then apply. Confirm the rendered result and selection outline match.
8. Use the mouse wheel to zoom. Hold Space and drag to pan. Confirm images remain anchored to their world coordinates.
9. Hide the Decorations layer and confirm its images disappear and cannot be selected. Show it again.
10. Set the Decorations layer opacity to 50% and confirm all objects on that layer become translucent.
11. Export PNG, JPG, SVG and PDF. Open each file and confirm both images are present, correctly positioned, sized and rotated.
12. Check the browser console for uncaught errors.

Record browser name/version, operating system, each pass/fail result, and console errors. Node tests do not replace this manual browser check.


## Phase 3B Shared Asset Library browser verification

Run from `worldforge_ui_prototype/` after pulling the latest `main`:

```powershell
npm run assets:fixture
npm test
npx --yes http-server . -p 8000 -c-1
```

Open `http://localhost:8000`, open a map project, then verify:

1. Open **Asset Library** from the top navigation while Select is active. Confirm the library shows all enabled assets and the Pack list.
2. Import `tests/assets/fixtures/classic-fantasy.wfpack`. Confirm the Pack appears and its assets are visible.
3. Search by asset name, asset ID, Pack name and tag. Confirm the result count and cards update.
4. Filter by Pack and category; combine the filters and confirm only matching assets remain.
5. Select an asset card and confirm its image and metadata appear in the preview.
6. Switch to **Place Asset**, reopen the library and confirm the list is filtered to assets compatible with generic placement. Select one and place it on the map.
7. Switch to Icon Tool. Confirm only the castle icon (`ICO-001`) is listed, select it, and apply it. Click on the map and confirm the castle emblem renders as an icon object.
8. Switch to Terrain Tool. Confirm only stamp-compatible assets are listed (the mountain fixture), select `Sample Mountain`, and click the map. Confirm an image stamp is placed centered at the click point. With no selected asset, verify the existing polygon-area workflow still works.
9. Switch to Lake Tool. Confirm only `Lake Water Texture` (`WTR-001`) is listed, select it, and drag to create a lake. Confirm the texture repeats inside the ellipse boundary and the outline remains visible. With no texture selected, confirm the original solid-color lake fill still works.
10. Disable the imported Pack. Confirm its assets disappear from results and any active selection from that Pack is cleared.
11. Re-enable the Pack and confirm its assets return. Uninstall it and confirm the Pack and assets disappear.
12. Reopen the library and confirm no duplicate element IDs, uncaught console errors or broken previews.

Pack installation and enabled state are currently in-memory for the editor session; persistence across reloads is not part of Phase 3B.


## Phase 3C.4 — Border Tool pattern-stroke browser QA

After pulling the latest `main`, run:

```powershell
npm run assets:fixture
npm test
npx --yes http-server . -p 8000 -c-1
```

Open `http://localhost:8000`, open a map, import `tests/assets/fixtures/classic-fantasy.wfpack`, then:

1. Select **Border Tool** and open Asset Library. Confirm only `Stone Border Pattern` (`BND-001`) is offered.
2. Select the pattern and draw a long straight border. Confirm the pattern repeats continuously along the stroke and the existing vector line remains underneath as a fallback.
3. Draw a diagonal border and a multi-segment border. Confirm each tile rotates to follow the local path direction.
4. Select a patterned border and verify its selection bounds include the artwork extending beyond the centerline.
5. With no pattern selected, draw another border and confirm the original dashed vector border is unchanged.
6. Export PNG, JPG, SVG and PDF; confirm the patterned border is present in every format and check the console for errors. SVG embeds the pattern image as a data URI; Canvas-based PNG/JPG/PDF export preloads the pattern asset before rendering.


## Phase 3D.1 — Generic Place Asset placement

The generic placement tool supports two gestures: click to place an asset at its configured default dimensions, centered on the pointer; drag to define a custom bounding rectangle. The Place Asset toolbar exposes default width/height, rotation, opacity and fit mode (contain/cover/fill). The tool rejects placement when no asset is selected or the active layer is hidden/locked.

After pulling the latest `main`, run:

```powershell
npm test
npm run assets:fixture
npx --yes http-server . -p 8000 -c-1
```

Browser QA:
1. Import the regenerated Classic Fantasy Pack and select Place Asset.
2. Choose Sample Mountain; confirm width/height controls initialize from Pack defaultSize.
3. Set rotation, opacity and fit; click once and confirm centered placement with the configured transform.
4. Drag from one map point to another; confirm the resulting rectangle follows the drag dimensions.
5. Repeat with Castle Icon and Stone Border Pattern if they are offered by generic capability filtering; verify unsupported assets are not offered.
6. Confirm no asset selection and hidden/locked active layers prevent placement.
