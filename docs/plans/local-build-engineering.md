# Local build engineering plan

Status: local v0 implemented; targeted engineering/design reviews repaired; TypeScript, production build, 76 unit/integration tests and 4 browser acceptance tests pass. Hosted/public MVP work remains planned.
2026-10-17. This is the concrete local work-package plan under the full MVP plan.
The user's build instruction supersedes the earlier review-only posture. Public
Supabase deployment/discovery remain subsequent full-MVP work, not claimed complete
by a local application. No commerce or cloud agent infrastructure is introduced.

## Reviewed implementation decisions (take precedence over sketches below)

Engineering review identified four blockers; root resolves them within authorized
scope as follows. Design review returned GO with the five refinements below.

1. All workshop-controlled edits to existing project files produce new candidate
   copies; the UI has no direct in-place save. Snapshot copies hash each allowed
   source before/after copying and reject changes or symlinks. Results preserve
   original work. This is a workshop-write guarantee, not an OS confinement claim:
   independently launched agents retain their provider permissions. Adapter setup
   must say this plainly; no unrestricted permission auto-grant. Agent runs receive
   the candidate root, not an automatic instruction to mutate originals.
2. Every local API requires a process-generated cryptographic token supplied via
   server-rendered local entry HTML, then X-Workshop-Token headers. Token never
   appears in static JS, URLs, exported files or logs. Entry HTML is dynamic and
   accepts only configured loopback Host and non-cross-site navigation. API rejects
   foreign or literal-null Origin; absent Origin requires valid token and no browser
   cross-site Fetch Metadata. Exact configured port/loopback hosts only. Hosted mode
   disables local routes fail-closed. Permissions bound to run + pending request ID.
3. Init/copy/export never overwrite. Reject source/destination overlap, existing
   output and symlink ancestors. Use exclusive file creation in newly exclusively
   created directories; on failure remove only files this operation created, never
   a preexisting or concurrent arrival. Export files use exclusive creation rather
   than replacing rename. Registry identity collisions rejected; fresh UUID for
   copied project. Size/file-count limits bound snapshots and exports.
4. Keep immutable extraction originals. Any changed extracted value is reclassified
   manual unless unchanged supporting evidence is actually supplied; do not retain
   an extracted-manufacturer badge on an edited number. Input size/text/page limits,
   malformed/encrypted/no-text/partial PDF failures are visible; no successful
   extraction is claimed if parsing only partly completes. Text/field review can
   proceed manually with original source retained. PDF execution gets bounded time.

Design refinements: open the bundled mechanism with working parameter/Play/Reset
controls; reduced-motion starts paused. Dominant artifact surface and collapsible
agent dock. Ingestion shows source and editable/excludable rows, quantity default
zero. Files open result copies, with copy identity always visible. Responsive
drawers/dialog focus/Escape and canvas-independent controls are acceptance gates.
Documents-only examples open their guide. No pretend AI or inactive action buttons.

## First executable product (scope)

Deliver a local TypeScript/Next.js workshop with a distinctive, useful Studio:
editable ordinary project files, starter projects, parts/tools catalog, document
ingestion with evidence review, a working Three.js mechanism view, and local ACP
agent conversations. It must remain useful without an authenticated agent.

Use a single pnpm Next.js application with independently bounded core/server/UI
modules first. This implements the draft's allowed merging of small package
boundaries. Public core/CLI has no React/Next imports; Node host has no rendering
responsibility. Electron can wrap the UI and local host later. Next route handlers
are a local Node interface, never a hosted remote shell service.

## User flows and visual direction

Navigation: Workshop, Explore, Parts & tools, plus a project selector. The initial
view is an inviting workbench, not a settings dashboard: large interactive model,
project title/build stage, accessible artifact tabs and clear next actions.
Warm off-white work surface, dark ink/nav rail, blue industrial accents, restrained
orange for actions and active states. Clear typography, compact spec tables and
visible provenance. Models are explanatory previews, not photoreal part promises.

```text
Navigation | project title / status / open files / export
           |------------------------------------------------
Projects   | artifact tabs: Overview / Model / Parts / Files
Library    | large preview/document     | Agent conversation
Explore    | selected details          | tool activity / stop
           | build guidance / notes    | explicit permission
```

All controls do work or clearly explain unavailable prerequisites. Never simulate
agent replies. On small screens use one main surface with explicit tabs. WebGL
failure leaves documents and catalog usable. Keyboard controls, visible focus,
Escape from dialogs, labelled inputs and reduced motion are required. Design
review will inspect the running UI and screenshots before the release report.

## Data and public boundaries

`src/lib/contracts.ts` defines shared Zod schemas and inferred types. Records use
UUID/string IDs validated at server entry. Catalog has parts and tools; definition
specs and owned quantity remain distinct. Tool use never decrements inventory.
Version/catalog writes serialize in-process and use atomic temporary-file rename.

App state under a configurable `METATRANSFORMER_HOME` (default `.workshop/`), ignored
by Git: catalog JSON, project registry, source documents, local releases and run
workspaces. Each project has ordinary `project.json`, README, ENGINEERING.md, files, BOM and source
references. IDs resolve through a registry, never arbitrary browser file paths.

Core types:
- Source: id, title, optional url/fileName/hash, capturedAt; original document/text
  retained locally. URL is citation metadata, not permission to fetch any network.
- Specification: label, value, optional unit, evidence kind, sourceId/quote/page.
- CatalogItem: id/name/kind/category/description/manufacturer/model/tags/specs/
  sources/ownedQuantity/notes/version/createdAt/updatedAt.
- Project: id/title/description/templateId/createdAt/updatedAt; manifest artifact
  paths and BOM entries carry project-local definition snapshots for portability.
- Artifact: relative path, kind and content hash; no executable preview on open.
- Draft ingestion: extracted document text, source, editable candidate fields and
  warnings. Import is not a catalog write; explicit reviewed save is a separate step.

## Parts documentation ingestion

```text
User pastes text or uploads text/Markdown/PDF (size limited)
 -> extract text (PDF pages preserved when available)
 -> local candidate extraction for labelled specifications
 -> show source text + editable fields/evidence
 -> user accepts/edits fields, name, type and quantity
 -> persist source + versioned catalog item
 -> use its snapshot in project BOM / tools list
```

No remote model is required to ingest. The initial extractor is deterministic and
honestly labelled; it does not infer undocumented ratings. Empty/scanned PDF gets
an actionable no-text result, not fake specs. Raw source is visible for manual
review and future user-agent refinement. Preserve unknowns and quoted evidence;
an extracted value remains a document claim, not verified compatibility. Browser
upload filenames cannot escape storage. Avoid arbitrary URL fetching in this pass.

Seed catalog uses genuine named manufacturer components with primary source URLs,
small factual specifications and explicit illustrative/unverified geometry. Owned
quantities default to zero. Tools are catalogued too. No stock/price assumptions.

## Project files and standalone CLI

Commands: `pnpm workshop init <directory> --template <id>`, `validate <directory>`,
`inspect <directory>`, `register <directory>` and `export <directory> <output>`.
Do not overwrite an existing repo's files/instructions; collision aborts before
mutation. Project guidance documents schemas/commands; CLAUDE.md can point to
AGENTS.md only if neither file exists. Native attachments remain unchanged.

Local service resolves registered roots through realpath and validates relative
paths, symlinks, sizes and file kinds. File writes require expected content hash;
web UI never executes an arbitrary command string. Plain code is rendered as text.
Markdown has no raw HTML/MDX execution; SVG is not injected into privileged DOM.

## Candidate changes: preserve external work

ACP runs in a fresh candidate directory copied from a bounded project snapshot,
excluding Git/secrets/caches. The original directory is never mutated by the agent
run or an automatic result adoption. Result UI shows candidate files and changes.
To keep a result, register it as a separate project revision/workspace; original
files remain intact. Do not claim a mutex protects against external native tools.
In-place merging is not implemented until an enforceable concurrency contract is
available. UI says "Open result copy" rather than implying original files changed.
This trades disk copies for a concrete no-overwrite guarantee at prototype scale.

## Agent connection

ACP stable SDK, tested installed adapters only. `codex-acp`, `claude-agent-acp`,
`opencode acp` are allowlisted executable configurations, no arbitrary browser
command. Missing adapter/auth is visible with setup guidance, not fake chat.
Sessions live in a server process singleton; UI polls normalized run state/events.
ACP initialize/new/prompt/update/permission/cancel are implemented. Read/write
client capabilities restricted to candidate root; unsupported terminal capabilities
not advertised. Agent-owned tools retain their actual provider sandbox policy;
ACP is not described as OS isolation. No automatic approvals. Credentials remain
with supported local agent auth. Interrupt/error retains partial candidate data.

```text
idle -> connecting -> ready -> running -> permission-needed -> running
                  -> auth-required/error           -> cancelled
running -> completed / failed / cancelled
completed -> inspect -> open result copy
```

## Routes / caller permissions

One local API namespace dispatches typed operations, backed by domain functions.
GET bootstrap returns projects/catalog/templates/status. Project/file reads only
within registry; writes include expected hashes. POST create/import/save catalog/
project metadata/run/permission/cancel/export validates payload with Zod.
Loopback-only dev/start; reject nonlocal Host and cross-origin mutations, require
JSON for mutation routes and a local session token where applicable. No CORS wildcard.
Disable local APIs entirely in a hosted public deployment. Source/private inventory
never included by a project export unless referenced and explicitly selected.

Local export is a source bundle with manifest, not a public upload. No private
agent transcript or global inventory. Published public pages will use inert
rendering and isolated active-file download handling in the hosted work package.

## Implementation and review ownership

Root: scaffolding/config/contracts/API integration/CLI/browser QA/docs.
Sol WP-A: core schema-adjacent domain logic, storage, ingestion, seeds and tests.
Sol WP-B: Studio React UI/CSS + Three.js viewer and interaction states.
Sol WP-C: ACP local sessions/permissions/candidate workspace support and tests.
All dispatches name an exact closed allowlist. Workers do not stage/commit or
modify shared contracts; needed changes are reported. Root audits paths/hunks and
repeats meaningful tests. Cross-package tests and route coverage are root-owned.

## Gates

- Engineering reviewer checks data loss, auth boundaries, ingestion honesty,
  candidate lifecycle, imports/exports and contract completeness before dispatch.
- Design reviewer checks hierarchy, first-use excitement, interaction coverage,
  mobile/accessibility and no pretend controls; browser review repeats after build.
- Typecheck, Vitest and production build pass. Playwright exercises create project,
  document ingestion/edit/save, inventory reuse, files, model and export.
- PDF text extraction tested on a real minimal PDF, with scanned/empty/error paths.
- Agent protocol tests cover actual messages; live handshake and one bounded run
  are separate evidence. No physical hardware validation is claimed from software.
- User can open app and immediately use examples/catalog without credentials.
- Report local implemented scope and unfinished full-MVP hosting honestly.

## Remaining follow-on scope

Hosted Supabase auth/publication/search/spatial discovery, additional native-tool
adapters, physical build validation, and polished packaging remain in the full MVP.
Their engineering plans must be concrete before those packages dispatch. No cloud
service credentials are assumed; lack of configured cloud services cannot break
the local product.

## Engineering plans are project artifacts

Every starter includes ENGINEERING.md with the intended outcome, measurable
requirements, architecture and interfaces, component/tool needs, staged assembly,
expected validation observations, and unresolved assumptions. The plan explicitly
records that starter hardware has not been tested. Agents update it with the design;
users can read and edit it without Studio. The application implementation itself is
broken into the reviewed work packages above. Hosted and native-adapter work must
receive concrete contract/design plans before implementation.

## Implementation review findings and repair packages

The first API and subprocess ACP tests passed. A separate bounded live Codex run
created an actual source file and registered its result while preserving the original.
Read-only review found additional issues to fix before the local release:

- A2: cross-process CLI/Studio mutation lock, copy-based BOM/parameter edits,
  idempotent registration, manifest editing, individual unavailable-project warnings,
  selected-file snapshot exports, and ownership tracking before writes.
- B2: preserve editor drafts, engineering-file links, current-project agent controls,
  source quotes and unit edit attribution, selected-file export dialog, and correctly
  scale millimeter linkage geometry into the camera. First browser inspection found
  the original dimension mismatch and the mobile dock obscuring the artifact.
- D: replace the sensor worksheet with a concrete Pico/BME280 wiring and firmware
  tutorial, with explicit untested hardware status and executable logic tests.
- E: first-class local PNG/JPEG/WebP and self-contained GLB artifact previews.
  Ordinary files are registry-bound, size/magic checked, no SVG/HTML execution;
  GLB external resource requests are rejected. No physics claim from geometry.

These are repairs/completion of the planned local files/build workflow. They do
not add commerce, cloud agents, or public publication scope.

## Learning at different levels

The engineering plan stays complete. Each template additionally supplies a short
START_HERE.md explaining the outcome, needed skills, first action and observable
success; GLOSSARY.md explains terms in plain language with examples; LEARNING_PATH.md
connects prerequisites and next projects. Readers choose guidance without a forced
skill-level label. Engineering documents link to relevant terms. Studio opens local
links, glossary anchors, trusted external references and template-start links.
All learning files remain plain Markdown and are selected for source exports.
The sensor tutorial provides the first complete firmware/wiring path; other starters
remain explicit concept/engineering starting points, not claimed completed builds.

The ingestion file limit is 24 MiB, raised after testing the official 17.3 MB,
31-page Raspberry Pi Pico datasheet. A bounded parser extracted text and source-
quoted features; legal prose is excluded from candidate specs. Manual review is
still required. No OCR or URL fetching is claimed.

## Final local implementation evidence

Implemented local Studio, five scaffold templates, engineering and learning files,
real parts/tools catalog, 24 MiB document/PDF ingestion with source review, editable
result copies, ACP sessions and permission handling, source bundle export/import,
and inert image/self-contained GLB previews. No hosted account is needed.

Independent implementation review repairs were completed: cross-process storage
locking, copy identity preservation, selected exports, unavailable-project handling,
and a bounded cancellation watchdog. A fake adapter that ignores both ACP cancel
and SIGTERM is stopped before its result can be adopted. Live Codex ACP was also
verified with a bounded real file-writing run; the original remained unchanged.
Claude/OpenCode are optional integrations and have not been live-tested here.

Browser verification covers mechanism controls, engineering-document draft retention,
reviewed part ingestion, exports, mobile layout, tutorial-to-template navigation,
glossary anchor jumps and Markdown wiring tables. The review caught and fixed
mobile clipping and a premature glossary scroll. Native GLB preview cleanup was
corrected for React's repeated effect setup in development.

TypeScript, production build and 76 unit/integration tests passed during final
verification. Build tracing excludes local workspace data and contains no .workshop
files. CLI init/export/import/validate preserved learning files and firmware bytes
while assigning a fresh imported identity. Source bundle import is currently CLI-only.
Physical assembly, sensor accuracy and servo/mechanical performance remain untested.
The local v0 is distinct from the remaining hosted/public discovery and publishing MVP.
