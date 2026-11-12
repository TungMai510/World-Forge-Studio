# Asset Foundation and Image Renderer tests

Requires Node.js 20 or newer. No third-party test dependencies are required for the test suite.

From `worldforge_ui_prototype/`:

```bash
npm run assets:fixture
npm run test:assets
npm test
```

The fixture generator creates `tests/assets/fixtures/classic-fantasy.wfpack` using the application's ZIP writer. The Pack contains two generated, valid PNG images with different dimensions and aspect ratios (96×64 mountain and 64×96 forest). These are technical QA illustrations, not production art. The sample manifest uses CC0-1.0 for the generated fixtures.

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
