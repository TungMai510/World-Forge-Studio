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
