# WorldForge AI Architecture Specification

**Status:** Long-term architecture specification — planning only; not an implementation authorization  
**Date:** 12 November 2026  
**Product:** WorldForge Studio  
**Related documents:** ROADMAP_WORLD_FORGE_STUDIO.md, WORLD_FORGE_MODULAR_STUDIO_ARCHITECTURE_ROADMAP.md, ASSET_PACK_SPECIFICATION.md

---

## 1. Purpose and product position

WorldForge AI is the shared, optional AI capability layer for WorldForge Studio. It supports creative work and controlled automation across Studios while preserving the principle that WorldForge Studio remains fully usable without AI.

AI does not replace the Map, Asset, Character, Civilization, History & Timeline, Power System or Story Studios. Those Studios remain the owners of their domain workflows and canonical data. AI acts through documented APIs and contracts.

This specification records future architecture requirements. It does not authorize implementation during the active Asset System phases.

## 2. Non-negotiable principles

1. AI optional: disabling AI must not block project creation, editing, saving, importing or exporting.
2. Provider agnostic: do not bind the product to one model or provider.
3. Local-first compatible: support user-provided credentials and, where feasible, local model adapters. Cloud processing must be explicit.
4. User authority: generated content is a proposal until the user approves it.
5. Canonical data protection: AI cannot silently overwrite or delete authored world data.
6. Validated writes: all changes go through normal domain/Core services, validation and History/Undo/Redo.
7. Least privilege: agents receive only task-scoped tools and data access.
8. Traceability: retain sufficient generation provenance and action history, subject to privacy settings.
9. Safe asset ingestion: generated assets use the same validation pipeline as imported assets.
10. No executable model output: never execute arbitrary generated code or Pack-provided scripts as part of normal AI workflows.

## 3. Conceptual architecture

WORLD FORGE STUDIO
    |
    +-- STUDIOS
    +-- WORLD ASSISTANT
            |
     WORLDFORGE AI LAYER
            |
        AI GATEWAY
       /     |      \
 Text     Image    Local
 Adapter  Adapter  Adapter
   |        |        |
 Text LLM Image AI Local Model
            |
 STRUCTURED OUTPUT / TOOL CONTRACTS
            |
 PREVIEW -> VALIDATE -> USER APPROVAL
            |
     WORLD DATA CORE APIs
            |
    HISTORY / UNDO / AUDIT

The diagram is conceptual. Exact process boundaries, network topology and deployment model are implementation decisions for a later phase.

## 4. Responsibilities

### 4.1 WorldForge AI Layer

- Exposes common task APIs to Studio modules.
- Builds minimal task context from authorized World Data Core queries.
- Selects a task-capable model adapter.
- Applies task templates and structured output schemas.
- Coordinates multi-step generation workflows.
- Returns proposed changes and generated files with provenance.
- Does not own canonical world entities.

### 4.2 AI Gateway

- Provider/model registry and adapter lifecycle.
- Task-based routing and fallback policy.
- API key/credential configuration and secure storage integration.
- Request limits, timeout, retry and error normalization.
- Token/image usage and estimated cost tracking where provider data permits.
- User-visible disclosure of which provider receives data.
- Privacy controls, context minimization and cancellation.

The Gateway must not expose secrets to browser UI logs, prompts, generated files or Pack manifests.

### 4.3 Model adapters

Separate adapters should be possible for text LLMs, image generation/editing models, local models and future specialized modalities when a concrete product requirement exists.

An adapter normalizes provider-specific requests and responses into WorldForge task contracts. Provider-specific response formats must not leak into Studio domain schemas.

### 4.4 World Data Core integration

AI reads world context through documented query APIs. Context may include selected entities, relevant relationships, user-selected map regions, applicable civilization rules or story timeline slices.

The context builder must:
- Fetch only information needed for the current task.
- Respect project/module permissions and user selection.
- Mark source entity IDs and versions so stale proposals can be detected.
- Avoid sending an entire project by default.
- Allow the user to inspect or limit the context sent externally.

AI writes must use a proposal/command model:
1. Build a proposed change set.
2. Validate schema and referenced entity IDs.
3. Detect stale versions/conflicts.
4. Show a preview/diff.
5. Obtain user approval.
6. Commit through domain services and normal History.
7. Support undo/rollback where the operation is reversible.

## 5. AI interaction levels

| Level | Behavior | Example |
|---|---|---|
| Suggestion | Returns ideas; no data mutation | Suggest names for a new city |
| Assisted Creation | Generates editable drafts or assets for review | Draft a character profile and portrait |
| Agent | Executes a bounded multi-step workflow through approved tools | Propose a city, locations, history records and related characters |

Agent workflows must declare their planned actions, required context, expected outputs and write scope before execution. A final review is required before canonical changes are committed. Long-running tasks should support cancellation and partial-result review.

## 6. Studio capability map

| Studio | Candidate AI capabilities |
|---|---|
| Map Studio | Map-layout ideas, terrain/region concepts, place-name suggestions, reference imagery and proposed map-object placement |
| Asset Studio | Icon/texture/object generation, variants, cleanup requests, metadata suggestions, pack assembly assistance |
| Character Studio | Character profile, biography, appearance, personality, relationships, costume and portrait drafts |
| Civilization Studio | Nations, cultures, languages, customs, institutions, political structures and faction concepts |
| History & Timeline Studio | Events, causes, consequences, chronology proposals and alternate-history branches |
| Power System Studio | Sources, branching progressions, abilities, constraints, costs and interaction-rule drafts |
| Story Studio | Premises, outlines, arcs, scenes, dialogue drafts and continuity analysis |
| World Assistant | Context-aware Q&A and bounded cross-Studio workflows |

These are candidate capabilities, not promises that every model can perform them reliably.

## 7. AI Asset Pack generation workflow

1. User describes the desired Pack, art direction and target usage.
2. AI proposes an asset inventory and a consistent visual specification.
3. User approves the inventory and generation parameters.
4. Image adapter generates assets or variants.
5. User reviews, selects, edits or regenerates outputs.
6. Asset pipeline normalizes supported formats, dimensions and thumbnails.
7. AI may suggest names, descriptions, tags, categories and usage capabilities.
8. User confirms metadata, license and attribution information.
9. Asset Pack Validator checks the manifest, files, paths, signatures, sizes, capabilities and security limits.
10. Asset Studio builds the .wfpack.
11. User imports the Pack into Asset Library and tests it in compatible tools.

Important constraints:
- Generated images do not automatically carry a valid distribution license.
- The user is responsible for confirming rights and attribution under applicable provider terms and intended distribution.
- AI must not invent a license or claim that rights have been cleared.
- The Pack must not contain executable code, provider credentials, hidden prompts or private project data.
- AI-generated content is not exempt from file and metadata validation.

## 8. Generation history and provenance

A future generation record should be able to capture, subject to privacy settings:
- Generation/task ID.
- Project/world ID and relevant source entity IDs.
- Source entity versions or hashes used for context.
- Provider and model identifier, where available.
- Creation timestamp.
- User-visible prompt/instructions or a privacy-preserving reference to them.
- Relevant generation parameters.
- Output references and content hashes.
- Validation result.
- User approval/rejection status.
- Commit/change-set ID if applied.

Do not store API keys or other secrets in generation history. Users should be able to inspect and manage retained prompts/context according to the product privacy policy.

## 9. Privacy, security and cost controls

- Clearly disclose when project data or prompts are sent to an external provider.
- Minimize context and let users exclude sensitive or irrelevant project areas.
- Secure credentials using an appropriate platform secret-storage mechanism; never commit them to the repository or store them in project exports.
- Provide per-task and per-project usage limits where feasible.
- Show estimated or reported costs before expensive operations when provider pricing data is available.
- Support cancellation, timeouts and bounded retries.
- Treat model output as untrusted input; validate all structured content and file outputs.
- Prevent prompt injection from world documents, imported assets or external text from expanding agent permissions.
- Restrict agent actions to an allowlisted tool API and explicit project scope.
- Do not allow AI to execute arbitrary JavaScript, shell commands or Pack content.

## 10. Failure and fallback behavior

- If AI is unavailable, all non-AI Studio features continue to work.
- If a provider fails, report the failure and allow retry or adapter/model selection.
- If output validation fails, preserve the draft for inspection but do not commit it.
- If source entities changed during generation, flag stale references and require regeneration or conflict resolution.
- If image generation partially succeeds, allow review of completed outputs without silently publishing an incomplete Pack.
- Avoid automatic provider switching when it would change privacy, data residency or cost characteristics without user consent.

## 11. Future implementation stages

| Stage | Scope | Dependency |
|---|---|---|
| AI-0 — Architecture readiness | Stable World Data Core contracts, asset ingestion contracts, permissions and project versioning | Core/Asset foundations |
| AI-1 — Gateway foundation | Provider adapters, credentials, usage controls, task contracts, disabled-by-default settings | AI-0 |
| AI-2 — Text assisted creation | Suggestion and draft generation for one Studio, preview and approval | AI-1 + first usable domain schema |
| AI-3 — Image/Asset generation | Image adapter, asset normalization, metadata review and .wfpack validation | AI-1 + Asset Studio |
| AI-4 — World Assistant | Context retrieval and cross-Studio Q&A with no automatic writes | Multiple stable Studio APIs |
| AI-5 — Bounded agent workflows | Tool allowlist, plans, change sets, approvals, rollback and audit | AI-4 + mature World Data Core |
| AI-6 — Quality and ecosystem | Evaluation sets, prompt/task templates, provider expansion and optional sharing | Stable usage and privacy model |

This sequence is strategic only. It does not supersede the active Asset System roadmap.

## 12. Acceptance criteria before public AI release

1. AI can be disabled without affecting core workflows.
2. Provider credentials are never exposed in logs, projects, Packs or generated content.
3. External data sharing is disclosed and context can be minimized.
4. Provider adapters can be changed without changing Studio schemas.
5. Structured output is validated before it is offered as a commit.
6. All canonical writes require user approval and use standard domain/Core services.
7. Undo/rollback and stale-data conflict handling are tested.
8. Agent tools are allowlisted, scoped and auditable.
9. AI-generated asset files pass the normal Asset Pack validator.
10. License/provenance is explicit and never fabricated by the system.
11. Usage limits, failure handling and cancellation are tested.
12. The application remains fully usable when providers are unavailable or AI is disabled.

## 13. Explicit non-goals for the initial architecture

- No single mandatory provider or model.
- No mandatory cloud AI subscription.
- No automatic mutation of canonical world data.
- No unrestricted autonomous agent.
- No executable code inside .wfpack.
- No guarantee that generated assets are commercially distributable.
- No AI integration during the current Asset System completion sequence.

## 14. Decision log

| Date | Decision |
|---|---|
| 12/11/2026 | WorldForge Studio should remain fully functional without AI; AI is an optional shared capability layer. |
| 12/11/2026 | Use a shared WorldForge AI Layer and AI Gateway with provider/model adapters rather than direct provider integrations in every Studio. |
| 12/11/2026 | Support Suggestion, Assisted Creation and bounded Agent levels, with preview, validation and approval before canonical writes. |
| 12/11/2026 | AI-generated assets must pass the same Asset Studio and .wfpack validation pipeline as manually imported assets. |
| 12/11/2026 | Local-first compatibility, user-provided credentials and provider choice are architectural requirements; exact implementation is deferred. |
| 12/11/2026 | AI is a long-term direction and does not change the active Asset System implementation order. |

---

**Maintenance rule:** Update this specification when AI provider strategy, permission boundaries, task contracts, privacy rules or generation workflows are formally changed. Update the active roadmap separately if a future decision changes near-term implementation priorities.
