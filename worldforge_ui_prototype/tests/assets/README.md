# Asset Foundation tests

Requires Node.js 20 or newer. No third-party test dependencies are used.

From `worldforge_ui_prototype/`:

```bash
npm run assets:fixture
npm run test:assets
npm test
```

The fixture generator creates `tests/assets/fixtures/classic-fantasy.wfpack` from the same ZIP writer used by the application. The integration test also creates this fixture before exercising the complete pipeline.

The sample Pack is deliberately tiny and uses two 1×1 PNG payloads. It is a technical fixture, not production art. Its manifest uses the CC0-1.0 declaration for these generated QA payloads.

The test suite verifies ZIP round-trip, manifest validation, path traversal rejection, unsupported archive content rejection, image signature checking, minimum Core compatibility, Pack registration and namespace identity, duplicate installation rejection, enabled/disabled behavior, Blob URL loading, and cache eviction/revocation.

Note: the current validator checks image signatures, not full image decoding. A later hardening task should decode images in a browser worker or trusted image decoder and enforce pixel/dimension limits before production distribution.


## Phase 2 image-object tests

Run the full Node test suite with `npm test`. The image-object tests cover schema validation, rotation-aware bounds/hit testing, renderer delegation, and the asynchronous image-load redraw path. Browser rendering still requires manual verification in the running application.


## Phase 2 browser verification harness

The manual browser harness is a development-only page. It uses the real Asset Pack parser, registry, loader, MapCanvasEngine, image renderer and map export service; it does not add features to the production UI.

1. From `worldforge_ui_prototype/`, regenerate the QA Pack:
   ```powershell
   npm run assets:fixture
   ```
2. Start a local static server from this directory:
   ```powershell
   py -m http.server 8000
   ```
   If the `py` launcher is unavailable, use `python -m http.server 8000`.
3. Open `http://localhost:8000/tests/assets/image-renderer-browser.html`.
4. Select `tests/assets/fixtures/classic-fantasy.wfpack` in the file picker.
5. Add an image. Wait for it to decode and appear.
6. Add a second copy and verify the topmost image is selected first; drag each image to verify world-space movement.
7. Change width, height, rotation, opacity and fit mode (`contain`, `cover`, `fill`), then apply. Confirm the rendered result and selection outline match.
8. Use the mouse wheel to zoom. Hold Space and drag to pan. Confirm the image remains anchored to its world coordinates.
9. Hide the Decorations layer and confirm its images disappear and cannot be selected. Show it again.
10. Set the Decorations layer opacity to 50% and confirm all objects on that layer become translucent.
11. Export PNG, JPG, SVG and PDF. Open each file and confirm the image is present, correctly positioned, sized and rotated.
12. Check the browser console for uncaught errors.

Record the browser name/version, operating system, each pass/fail result, and any console error. The Node test suite does not replace this manual browser check. The fixture is a 1×1 technical PNG, so it verifies image decoding and placement, not visual quality or realistic aspect-ratio behavior.
