# CURRENT_PHASE_CONTEXT — World Forge Studio

> Operational context for coding agents. Keep this file under 150 lines and verify it against source before each phase/task handoff.
> Source of truth for product direction and architecture: \`WORLD_FORGE_STUDIO_MASTER.md\`.
> Repository: \`TungMai510/World-Forge-Studio\` · branch: \`main\` · app: \`worldforge_ui_prototype/\`
> Last source inspection: 14/11/2026. This file records observed structure, not a claim that pending work is implemented.

## 1. Active milestone

**Phase 4.4 — Final Persistence/Archive Acceptance QA.** Do not begin broad Phase 5 UI work until Phase 4.4 exit criteria are verified. First Usable Build order remains 4.4 → 5 → 6 → 7.

## 2. Verified source entry points

| Path | Observed responsibility / API |
|---|---|
| \`src/app.js\` | Creates \`DatabaseManager\`, \`ProjectService(database)\`, then \`UIController(projectService)\`; initializes UI on DOMContentLoaded. |
| \`src/data/database-manager.js\` | IndexedDB database \`worldforge-studio\`, version 1; stores \`projects\` and \`recentProjects\`. Public methods: \`open\`, \`request\`, \`getProject(s)\`, \`putProject\`, \`addProject\`, \`deleteProject\`, recent-project CRUD and \`deleteProjectAndRecent\`. |
| \`src/services/project-service.js\` | \`ProjectService(database)\`; create/open/get/list/update/save/duplicate/delete/import; JSON and \`.wforge\` export/import; schema version 2 and v1→v2 migration; validates map, geography, civilization, history and asset snapshots. |
| \`src/services/archive-service.js\` | ZIP/archive read/write helpers imported by ProjectService. Inspect before changing archive behavior. |
| \`src/services/project-asset-snapshot-service.js\` | Snapshot capture, image byte validation, SHA-256/integrity helpers imported by ProjectService. |
| \`src/assets/asset-pack-service.js\` | \`AssetPackService({registry, loader, worldForgeVersion})\`; \`inspectPack\`, \`installPack\`, \`uninstallPack\`, \`setPackEnabled\`. Import parses ZIP, validates manifest and checks duplicate Pack ID. |
| \`src/assets/asset-registry.js\` | Pack/asset registry used by AssetPackService. Read current implementation before designing persistence. |
| \`src/assets/asset-loader.js\` | Asset loading/cache/resource lifecycle; passed to AssetPackService for invalidation. |
| \`src/ui/layout.js\` | \`UIController(projectService)\`; currently constructs AssetRegistry, AssetLoader and AssetPackService directly, initializes MapCanvasEngine and wires project workflows. Large UI controller; avoid broad rewrite. |
| \`tests/assets/\` | Asset/archive/image regression tests and browser harnesses. Inspect package scripts and relevant tests before adding coverage. |

## 3. Current observed constraints

- \`package.json\`: ES modules, Node >=20; scripts: \`npm test\`, \`npm run test:assets\`, \`npm run assets:fixture\`.
- Project archive limit is 100 MB; project snapshot aggregate limit is 20 MB; individual snapshot file limit is 15 MB (declared in ProjectService).
- Asset Pack import currently has a 100 MB pack limit and validates manifest/files before registration.
- DatabaseManager uses IndexedDB transactions and resolves writes on transaction completion; inspected code has no explicit \`navigator.storage.persist()\` request or dedicated QuotaExceededError UX handling.
- ProjectService validates data and spreads top-level project data in \`validateProjectData\`; nested service constructors may normalize records. Do **not** assume unknown nested entity fields survive. Add a targeted round-trip test before changing normalization.
- AssetPackService currently operates with an in-memory AssetRegistry supplied by UIController. Persistent Pack Registry/Manager is Phase 5 work, not confirmed implemented.
- UIController constructs AssetPackService itself. Extract one narrow \`AssetPackApplicationService\` facade before Phase 5 management UI; avoid a general service/repository framework.
- ProjectService stores project snapshots in project data; test snapshot resolution after Pack disable/uninstall. Do not let a Pack update silently replace pinned snapshot bytes.

## 4. Lean Hardening decisions

**Do now:** storage persistence request (feature-detected); safe-save handling for quota/write errors; preserve previous saved project on failure; unknown-field round-trip; project snapshot pinning; minimum World Forge version compatibility; locked/hidden layer mutation protection; one Pack application-service boundary; six P0 checks below.

**Defer:** transaction journal/startup recovery framework; multi-state Storage Health service; ZIP streaming rewrite and blanket multi-worker migration; Pack dependency graph/cycle detection; complex Pack update preview; generic command-based Undo/Redo; repository/domain layerization across the app; all 18 proposed hardening tests at once; multi-model review for small tasks.

IndexedDB transactions are atomic within a transaction, but this does not protect against every application-level partial workflow spanning multiple transactions. Do not add a journal without a reproduced failure mode. \`navigator.storage.persist()\` is a request, not an absolute durability guarantee.

## 5. P0 acceptance checks

- **ST-02 QuotaExceededError:** save failure is surfaced; previous stored project remains readable; no automatic deletion.
- **ST-03 Failed save:** failed workflow does not replace the last valid saved version.
- **ST-04 Unknown fields:** unknown fields at project/data/entity levels survive load → edit known field → save → export/import.
- **ST-05 Clean profile:** import \`.wforge\` v2 without source Pack and render from embedded snapshots in an independent browser profile.
- **ST-10 Version pinning:** Pack update/disable does not silently change asset bytes used by a saved project.
- **ST-11 Uninstall references:** uninstalling a Pack does not remove snapshots referenced by saved projects.

These are required checks, not claims that tests already exist or pass. Existing recorded baseline is 95/95 automated tests on 14/11/2026; rerun on the current commit before reporting it as current.

## 6. Task handoff rules

Every coding task must state: objective; verified current behavior; exact in/out-of-scope; files to inspect/change; compatibility constraints; acceptance criteria; targeted tests; changed-file summary. Prefer one coding agent for a task. After at most three unsuccessful attempts on the same issue, stop retrying and perform root-cause analysis. Do not spend multiple models on routine small tasks.

## 7. Immediate execution order

1. Phase 4.4: implement/test storage persistence request and safe-save error handling; inspect/fix unknown-field preservation; complete ST-02/03/04/05 including independent browser profile.
2. Phase 5 preparation: inspect import/dependency boundaries; extract narrow AssetPackApplicationService; update this context from verified code.
3. Phase 5: persist Pack install/enable/disable/uninstall state in IndexedDB; protect project snapshots; validate \`minWorldForgeVersion\`; run ST-10/11.
4. Phase 6: basic Pack authoring/import validation, image decode check via \`createImageBitmap()\` where supported, \`.wfpack\` export; prepare Natural Terrain and World Symbols sample Packs.
5. Phase 7: end-to-end first usable build, including offline and independent clean-profile verification.

## 8. Reporting discipline

Use only these labels accurately: **Implemented**, **Automated tested**, **Browser verified**, **CI verified**. A design note is not implementation; a passing unit test is not browser acceptance; a successful GitHub commit is not QA completion. Update the master document for product/architecture/roadmap decisions; keep this file short and operational.
