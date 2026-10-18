# Metatransformer MVP execution plan

Status: Full product roadmap. The user subsequently authorized implementation; the reviewed local v0 is implemented and undergoing final verification. Hosted/public work remains planned. See local-build-engineering.md for current decisions.
Date: 2026-10-17. Repository: robot-workshop; no Git repository or application yet.
Decision history: [workshop-foundation.md](workshop-foundation.md).

## Outcome and scope

An open-source local workshop where a user brings an existing coding agent,
develops a physical invention as real project files, understands what is and is
not validated, and shares a useful result that another person can inspect/remix.
The primary output is learning and guidance for building the thing. Documents,
illustrations, code and parts are first-class; 3D and simulation are optional.

This is the proposed complete MVP, with a local alpha as an intermediate milestone.
Public sharing and discovery remain part of the MVP; local alpha alone is not
completion of the entire product requirement. Cloud agents and commerce are not
required for either stage. All new technical remedies below are proposals until
reviewed; decisions already accepted are carried forward without re-asking.

| Requirement / decision | MVP responsibility | Proof |
| --- | --- | --- |
| D2, D7: portable authored files | Open manifest, documents/assets/native files | Open a documents-only project without a scene |
| D9: local agent execution | Local host and user's agent | Generate/edit artifact without platform inference |
| D12: ACP | One protocol client, tested adapters | Prompt, permission, stop, error, artifact edit |
| Any-agent compatibility | Files and documented CLI; integrated capabilities advertised | External editor change appears; unsupported integration explained |
| D14: repository-first creation | Public scaffolding/toolkit and agent-readable guidance without Studio | Fresh Git repo authored through standalone agent opens in Studio unchanged |
| D16: local parts/tools library and owned inventory | Catalog/search/reuse definitions and equipment across projects; record ownership separately | Reuse a part/tool in two inventions without treating project requirements as owned stock |
| Three.js and 3D discovery | Optional artifact viewer; spatial public gallery | Same project reachable through gallery and search |
| Shareability on X | Exportable presentation, published project/source | Visitor understands result without login or install |
| D10: open core | Useful local Studio/toolkit without hosted account | Core flow works with hosted services unavailable |
| Supabase replaces Mongo | Hosted identity, ownership, release/catalog records | Cross-user and direct API access tests |
| D11: affiliate direction deferred | Local BOM and ordinary supplier links | Parts without supplier URLs remain valid |
| D4/D5/D6 exclusions | No checkpoint UI, multiplayer or comparison UI | Scope audit of work packages |
| Electron later | Separate platform-neutral UI/core from Node host | No Electron/native imports in shared UI/core |
| D13: open-format interoperability | Preserve editable native source; standard exchange artifacts | Reopen selected outputs in Blender/engineering tools without claiming lossless conversion |

Non-goals: proprietary reasoning loop, universal engineering solver, automatic
hardware control, cloud agent execution, API-key billing product, purchasing or
fulfillment, referral automation, multiplayer, custom CAD editor, and an invented
general-purpose physics language. No automatic social posting. Project examples
must not imply engineering certification or proven physical performance.

## System architecture and dependency direction

```text
LOCAL COMPUTER
  Browser: Studio (Next.js, React)
    | local session, product events, selected artifact requests
    v
  Node workshop service (loopback)
    +--> project files + revision/candidate store
    +--> validation / explicitly invoked artifact tools
    +--> ACP client --> installed agent/adapter --> provider chosen by user
    +--> preview data --> browser artifact viewer (Three.js when useful)
    |
    +-- explicit publish of selected immutable release -----------------+
                                                                      |
OPTIONAL HOSTED PRODUCT                                                v
  Next.js web routes --> ownership/authorization --> Supabase records + blobs
    ^                                                   |
    +------ SSR public pages / search / 3D discovery <---+ published only
```

There is no agent process on the public server. A public website cannot silently
start a visitor's local agent. Published pages can be viewed without installing
Studio; authoring/remixing locally requires the local application and an agent.

Proposed workspace (greenfield; package manager not installed): pnpm workspace,
TypeScript strict mode, functional domain operations and Zod boundary validation.

```text
apps/
  studio/         local Next.js UI; no hosted-account requirement
  web/            hosted Next.js public pages and server-only auth/data routes
packages/
  core/           portable schemas, identities, units, validation and manifests
  workshop/       Node service/CLI, project files, revisions, tool execution
  agent-acp/      ACP lifecycle and capability/event translation
  viewers/        shared React document/media/code/parts/Three.js viewers
examples/        reproducible invention projects and expected artifacts
```

`core` imports neither Next.js nor cloud/process modules. Viewers consume validated
artifact descriptors, not arbitrary filesystem paths. Agent code cannot own the
project format. Hosted services depend on the public core schema, never the local
agent runtime. The local Node host is long-lived independently of a browser tab;
hosting it as a serverless function is not the local architecture. Electron can
later replace the browser launcher while using the same UI and local host APIs.
Exact package splits can be merged if scaffolding reveals unnecessary overhead.

## Project format v0 proposal

```text
my-invention/
  project.json        schema version, identity, entry document, artifact references
  README.md           what it is, how to build/use it, known limitations
  docs/               requirements, illustrated instructions, calculations
  parts/              definitions and bill of materials
  assets/             images, diagrams, geometry
  src/                generator, firmware or other source files when relevant
  experiments/        inputs, assumptions, outputs and observations when relevant
```

These directory names are conventions. Manifest references identify artifacts;
empty directories and a 3D file are not required. All portable references are
relative paths, validated against project boundaries. Unknown schema versions
open with a clear compatibility message; unknown artifact types remain downloadable
files rather than making the entire project unusable.

Manifest minimum: schema version, stable project ID, human title, entry document,
and artifact list with stable IDs, kinds, relative paths and optional derivation
references. Artifact kinds distinguish document/image/code/parts/model/experiment;
do not infer execution permission from a file extension. Project source and tool
outputs are distinguishable. Preview cache is disposable, not authoritative.

Parts/BOM minimum: a stable definition ID and version, name, typed specifications
with units, provenance/source date, plus BOM lines with reference, quantity and
optional notes. Quantities must fit their unit/type; unknown values are explicit,
not zero. Assemblies reference definitions; an owned physical instance is a
different identity. Supplier offer URLs and prices are not part identity. Prices
are optional dated observations, never guaranteed totals. Arbitrary user parts
need no global catalog ID or supplier link.

The existing local library requirement includes cross-project reuse, not just a
separate BOM in each project. A reused definition must keep its version/source
identity while projects remain portable without the originating library. Owned
items must be recordable separately and reference their definition; a project's
required quantity is not the same as the user's quantity on hand. The exact local
library storage and copy/reference flow remain engineering decisions. These
retained requirements belong to WP1's contracts and WP4's parts/library surface.

D16 explicitly includes tools and equipment in the growing personal catalog:
names, categories/tags, relevant specifications/capabilities, notes/images and
source references. Tools used for assembly/testing are separate from BOM components
and quantities. The agent can reference suitable recorded tools and help catalog
new entries; uncertain compatibility stays explicit. The catalog works locally
across projects with search and add/edit/reuse flows. Exact storage remains a
review decision. Project exports include required definitions/tool requirements,
not the user's full private inventory. Downloading a tutorial neither records
ownership nor consumes stock automatically. Advanced warehouse/accounting features
are not implied by a usable catalog.

Evidence records link a claim to a source, assumptions, applicable conditions and
one of: extracted specification, estimate, calculation, simulation, or physical
observation. User-facing labels follow this distinction. Initial ingestion is
agent/manual import into local files with source references and review; a hosted
scraping/normalization pipeline is deferred.

Markdown and static media cover documents. Native CAD/electronics/firmware files
stay intact; no lossy universal conversion becomes their source of truth. glTF/GLB
is a candidate visual interchange format. TypeScript can generate artifacts; it
does not replace native engineering formats or define accurate physics by itself.

User-requested open-format research now covers visual scenes, parametric CAD,
manufacturing files, circuits/PCBs, robot descriptions, multi-domain simulation,
and documents/BOM/evidence. See the completed documentation-based
[format landscape](../research/open-format-landscape.md). Its profile must separate
formats supported directly in v0, native files preserved as attachments, and
deferred tool adapters. No single scene graph can safely replace all those source
semantics. Blender interoperability is an explicit representative acceptance case.

Research recommendation, pending architecture approval: v0 directly displays
CommonMark, static images/constrained SVG, source text, workshop JSON records and
a tested glTF/GLB subset. Native Blender/CAD/KiCad/robot/simulation bundles are
preserved with supplied previews, not automatically interpreted or executed.
Agents/users can use existing local tools to export previews; automatic native
tool adapters remain separate scoped integrations. This is not a cut to native
source portability, nor a promise of built-in editors for every source format.

Each derived preview records its input artifacts/revision or content hashes,
generator/tool version and settings, and output hash. Missing/mismatched lineage
makes freshness unknown/stale. STEP exchange preserves supported shape/product
data, not necessarily a CAD application's sketch/feature history. Native source
stays intact beside exports. The report defines Blender, FreeCAD, KiCad,
documents-only and four-bar fixtures; none has been executed yet.

## Local authoring and agent contract

### Repository-first creation — accepted D14

Creating a project directly in an ordinary Git repository is a first-class entry
path, not just a fallback for unsupported agents. A user can start their preferred
coding agent in that repository, describe an invention, and use the public
Metatransformer toolkit without running Studio or an ACP connection. Studio opens
the resulting project later; there is no import into a different hidden format.

The toolkit must provide a documented scaffold command, versioned project schema,
agent-readable project guidance, examples, and noninteractive validation commands.
Exact package/command names remain implementation choices. Optional generation
commands invoke the same explicit recipes as Studio; source references, units,
derivations and evidence labels obey the same contract on both paths. Validation
reports actionable file/field errors and meaningful exit codes for agent use.

Scaffolding an existing repository must preserve its files and agent instructions;
never overwrite an existing README, manifest or AGENTS.md silently. Offer a
minimal documents-only template as well as applicable example templates. Keep
toolkit versions/dependencies reproducible and generated caches out of source
control; a project can use Git normally, but opening a project does not require a
Git remote, platform account or platform-specific repository layout.

Generated agent guidance explains how to inspect/edit files, validate, generate
selected artifacts, identify stale outputs and state physical-model limitations.
Use portable instructions with provider-specific discovery shims only where
tested. Do not assume every agent reads the same instruction filename. Public
CLI/file contracts work without MCP; ACP is for Studio's integrated conversation,
not a requirement imposed on an independently launched coding agent.

For external agents, Metatransformer does not own the session or guarantee how the
agent edits files. Studio observes/validates those changes when opened; it must
not claim it can cancel an independently launched process or recover its chat.
The same revision/conflict protections apply when Studio subsequently proposes
changes. Agent instructions cannot enforce filesystem isolation by themselves.

Repository-first acceptance: create a clean Git repo, scaffold without Studio,
use an independently launched agent to author a document/part/model as applicable,
run toolkit validation/generation, commit normal files, then open the same directory
in Studio. Verify artifact identity/content and fidelity labels remain intact,
with no cloud registration or application database migration. Also test an existing
repo with README and agent instructions to prove scaffolding preserves them.

### Studio-integrated agent

Studio sends a project reference, base revision and instruction to a local run.
The host resolves paths and translates session events into UI state. ACP provides
the agent-facing conversation protocol; stable capabilities are negotiated, and
the product does not depend on draft/vendor-specific extensions for its baseline.
ACP absolute paths remain in the host/agent boundary, not portable manifests.

Baseline: initialize, discover capabilities/auth requirements, create session,
prompt, stream visible updates/tool activity, answer permission requests, cancel,
report completion/error and reconcile changed artifacts. Session resume is offered
only if supported. Switching agents starts a new agent session with project
context; transferable provider conversation memory is not promised.

Codex is the first proposed live-tested integrated adapter. Claude and OpenCode
have documented ACP paths but need a compatibility matrix covering tested release,
auth, file edits, permission handling, cancellation and session resume. File/CLI
compatibility is broader than integrated-chat compatibility. No automatic package
download on opening an untrusted project; adapter installation is a setup action.

The agent owns its supported authentication flow; secrets never enter project
files or public manifests. Show missing authentication and provider usage-limit
errors, without silently switching to platform-paid inference. Existing providers
may require network access; local-first means local files/execution control, not
that every chosen model can run offline.

```text
disconnected -> connecting -> authentication-needed -> ready
                       \-> connection-failed
ready -> running -> waiting-for-permission -> running
             |              | denied -> visible tool result / agent continues
             +-> cancelling -> cancelled
             +-> completed -> candidate validation -> ready-to-inspect / invalid
             +-> failed
```

Terminal states do not become successful because partial files exist. Permission
requests are never silently granted. Cancel is not undo; any partial output stays
clearly identified. Navigation away does not imply cancellation; reopening Studio
reconnects to host-owned run status. Host restart marks unrecovered running work
interrupted rather than pretending it succeeded. The maximum parallel integrated
runs per project is a review decision; propose one to keep ownership intelligible.

## Revisions, previews and publication

Already accepted: authored files are authoritative; released public state is an
explicit validated revision; publication failure preserves the previous release.

Proposed run isolation: integrated agents work in candidate workspaces derived
from an identified base revision. A completed candidate remains inspectable.
Adoption must detect that the base has changed and preserve both versions. The
mechanism for adopting a candidate alongside arbitrary external editor writes is
an OPEN engineering issue. A file watcher, per-process mutex or a check followed
by a write is not proof that another process cannot race and lose changes.

```text
base revision -> candidate workspace -> agent edits -> validation
                                                | invalid: errors + files retained
                                                v
                                            inspectable result
                                                | base changed: conflict, retain both
                                                v
                                     explicit adoption (mechanism pending)

selected stable snapshot -> publish preview -> validation -> upload immutable files
      -> authorize + atomically set public release pointer -> public page
      any failure before pointer update -> old release remains public
```

Previews watch local authoring changes and validate before replacing rendered
state. Partial/invalid writes show a warning and last known valid preview. Deleted
artifacts appear missing; they must not masquerade as current old output. Cache keys
include content and tool/version/parameter inputs. Explicit execution results
record which input revision they represent; stale results are labelled.

Required concurrency probes:

```text
Agent candidate A       External edit B        Shared state
read base R             --                     R
work in candidate       save R2                current R2
finish candidate R1     --                     R1 retained; no R2 overwrite

Publisher A             Publisher B            Public pointer
prepare release P1      prepare P2             P0
complete P1             --                     conditional update per chosen order
--                      complete P2            cannot silently supersede newer intent
```

Both finish orders must be tested. The exact publish ordering remedy and revision
adoption mechanism require engineering review; diagrams express the invariant,
not evidence it is already enforced. Public assets always belong to the selected
release and cannot mix versions mid-page.

## User journeys and interaction states

Local welcome offers Describe, Open project, and Explore templates. An agent
selector/setup flow detects missing executable/auth without blocking reading
existing artifacts. No blank screen while connecting. The first instruction stays
visible and is not lost if setup is required.

Studio proposal: project navigation at left, artifact workspace in the center,
conversation/activity at right. Documents can fill the workspace; a project is not
forced into an empty 3D scene. Parts, build guidance and experiments are reachable
from project navigation. On narrower screens one main surface is visible with
explicit tabs; no squeezed three-column layout. Long tool logs are expandable.

| Surface | Empty/loading | Error/interrupted | Successful result |
| --- | --- | --- | --- |
| Project | Describe/open/template actions | Missing/unsupported manifest with recovery | Entry document and artifact navigation |
| Agent | Select/connect; connecting indicator | Auth, permissions, rate limit or exit shown | Conversation and changed-artifact links |
| Preview | No artifact message; loading state | Invalid/stale/missing clearly distinct | Valid content tied to revision |
| Parts | Add/import without buying requirement | Bad quantity/unit/source reference identified | BOM and source links |
| Experiment | Inputs/assumptions, explicit Run | Unsupported tool, failure or stale output | Result and fidelity label |
| Publish | Select artifacts and public preview | Retain draft + old public release | Stable share URL and source access |
| Discovery | Templates; loading; no search matches | Retry and usable list fallback | Same content in search/list/spatial view |

Public journey: view an understandable invention page without login; see images,
explanation, evidence labels and source/remix action; then install/open local
Studio as needed. Local installation friction is a deliberate test target. Remix
keeps attribution/source revision and honors artifact licenses. No promise of
one-click local launching until a secure installer/deep-link path is implemented.

Spatial discovery uses WASD/mouse when opted into. Escape releases pointer lock;
keyboard focus and ordinary navigation work outside it. Search/list is a full
alternative, including on touch devices, reduced-motion preference or WebGL
failure. Public HTML includes title, explanation and artifact links before 3D
loads. Avatar/companion embodiment and exact visual design remain review questions;
do not build an animated character as an unapproved dependency.

Documents-only projects appear in the spatial gallery as flat document/image/code
presentations, per the user's explicit requirement. Lack of a model must never
exclude a published project from that view.

## Use-case library and representative depth

The user-facing tutorial curriculum is described in
[tutorial-library.md](tutorial-library.md) with source-backed research in
[real-world-build-examples.md](../research/real-world-build-examples.md).
Tutorials progressively build the user's catalog of parts and tools; architecture
fixtures below are not automatically complete end-to-end tutorials.

| Fixture | What it must prove | What it does not claim |
| --- | --- | --- |
| Illustrated workshop jig | Documents, drawings, custom parts/BOM, instructions, share export | Requires a simulation to be useful |
| Four-bar drawing mechanism | Parametric geometry, joint representation, bounded kinematic experiment, graph/output, build notes | Load, friction, material strength or motor dynamics validated |
| Sensor logger | Wiring illustration, firmware source, part specs, calculations and build guidance | Firmware tested on hardware merely because code compiles |
| Quadruped representation | Native model/artifact import, joints/parts and gait visualization | General walking stability or accurate coupled robot dynamics |

These are architecture fixtures, not four separate domain engines. The proposed
hero example is the drawing mechanism because its motion and modifications are
easy to show; hero choice remains unapproved. Rover, irrigation and thermal
enclosure are further format stress cases, not extra launch simulator obligations.
The project's documented limits should remain visible in exported presentations.

## Security boundaries and failure registry

Proposed local controls: bind loopback, validate Host/Origin and local session,
allow only configured projects and trusted executable commands, validate decoded
paths and symlink boundaries, and avoid browser-supplied command-string execution.
Browser isolation does not sandbox the local coding agent. ACP permissions are
not OS confinement; trace agent-owned and client-provided shell/file tools during
the spike. Inspecting imported Markdown/media/model files must not run project code.
Do not render arbitrary MDX/HTML/JS in Studio's privileged origin. Proposed glTF
asset resolver blocks external/escaping resource references unless explicitly
permitted; file-size/complexity limits need measurement against fixtures.

| Error code | Trigger / boundary | Recovery and visible result | Test |
| --- | --- | --- | --- |
| PROJECT_NOT_FOUND | Open deleted/moved project | Re-select location; no blank UI | Integration |
| MANIFEST_INVALID | Missing version, bad references/types | Field/file errors; raw files retained | Unit + UI |
| VERSION_UNSUPPORTED | New manifest version | Explain supported versions; no destructive migration | Unit |
| PATH_OUTSIDE_PROJECT | Traversal/symlink escape | Reject access; show operation failure | Integration |
| AGENT_UNAVAILABLE | Missing executable/adapter startup | Setup guidance, reading still works | Integration + UI |
| AUTH_REQUIRED | Agent auth challenge | Supported sign-in flow; preserve prompt | Adapter + live smoke |
| PERMISSION_PENDING | Agent requests action | Visible explicit choices; no auto approval | Adapter + E2E |
| AGENT_PROTOCOL_ERROR | Invalid/unsupported event | Stop affected operation, retain diagnostic/run ID | Adapter |
| AGENT_EXITED | Process exits mid-turn | Mark interrupted, retain partial candidate | Integration |
| PROVIDER_LIMIT | Agent reports quota/rate limit | Show provider message; user controls retry | Adapter |
| EMPTY_AGENT_RESULT | No edits or useful output | State no changes; do not fabricate success | Adapter |
| AGENT_REFUSAL | Agent refuses task | Preserve explanation; no automatic bypass | Adapter |
| PREVIEW_INVALID | Partial writes/bad data | Keep labelled last valid preview + current error | Integration + E2E |
| EXECUTION_FAILED | Generator/experiment exit | Show bounded diagnostic, retained input/output | Integration |
| RESULT_STALE | Input changed since execution | Label stale; explicit rerun | Unit + E2E |
| REVISION_CONFLICT | Current state differs from run base | Preserve both; no overwrite | Controlled concurrency |
| STORAGE_FULL | Local write/snapshot fails | Keep source; report space failure | Fault injection |
| PUBLICATION_INVALID | Missing/secret/unselected artifacts | No public pointer change; actionable list | Integration |
| PUBLISH_UNAUTHORIZED | Wrong owner or missing auth | Deny; no private artifact disclosure | API integration |
| UPLOAD_FAILED | Network/storage failure | Retry idempotent immutable upload; old release live | Integration |
| RELEASE_CONFLICT | Competing publish intent | Show conflict; no silent ordering change | Controlled concurrency |

Error codes are proposed discriminated TypeScript results; do not invent framework
exception classes. Boundary catchers map known failures, retain causes privately,
and give unknown failures a run/request ID. Logs include operation IDs and safe
context, not credentials, raw private prompts or full project contents by default.
Retries are appropriate for idempotent reads/uploads; never automatically rerun
an agent turn or side-effecting experiment just because a connection dropped.

## Four-path data flows

```text
Prompt -> validate -> session -> candidate files -> validated preview
  missing: no submit | empty: actionable input hint
  failure: run state + preserved input/candidate | happy: inspectable change

File change -> normalize refs -> validate snapshot -> derive preview -> render
  missing: artifact missing | empty: valid empty doc or typed data error
  failure: labelled last valid render | happy: matching revision preview

Part/spec import -> preserve source -> schema/units -> project file -> BOM
  missing: source unknown explicit | empty: review incomplete part
  failure: reject malformed fields, preserve raw import | happy: inspectable record

Publish -> select snapshot -> validate/public preview -> upload -> public pointer
  missing: no selected revision | empty: reject unusable release with explanation
  failure: old release retained | happy: stable page + consistent artifacts

Discover -> query public releases -> SSR list -> optional spatial view
  missing: default explore | empty results: adjust query/templates
  failure: retry message; existing page remains usable | happy: public project
```

## Hosted data, auth and publication proposal

Supabase is for hosted accounts, ownership, public catalog and release metadata.
Local editing requires neither an account nor Supabase configuration. Proposed
records: profiles; projects with owner and visibility; immutable releases with
artifact manifests; publication pointer; remix provenance. Local project identity
and cloud authorization identity must not be equated: knowing an ID grants no
write permission. Auth method remains to be chosen during the engineering review.

All application data access goes through authorized server routes. Service-role
credentials stay on the server. No application RLS and no browser app-data queries,
as instructed. Restrict public role grants/Data API exposure; merely disabling RLS
is not a security design. Tests must demonstrate direct anonymous AND authenticated
data API requests cannot read or mutate private application tables.

File/blob storage and upload authorization remain open. Public assets must not be
retrievable from draft/private object URLs. Publication validates an allowlisted
artifact manifest; logs, credentials, agent transcripts and unrelated files are
excluded. Explain exactly what will be public before upload. Generated executable
source is downloadable; public viewing must not execute it on our servers.
Basic unpublish/removal must be designed for mistaken releases; cached/downloaded
copies cannot be recalled. Public indexes contain only selected released content.

## Verification and release strategy

Use Vitest for domain/protocol logic and local/hosted integration tests; Playwright
for user-visible flows. Scripted ACP fixtures exercise deterministic edge cases,
but a real local agent smoke test is separately required to verify integration.
Do not claim adapter compatibility from a mocked successful chat transcript.

| Behavior | Observable assertion / wrong result rejected |
| --- | --- |
| Documents-only creation | Entry document, image and BOM work with no 3D artifact |
| Repository-first creation | Standalone agent/scaffold/validate work without Studio or ACP; Studio opens the same files without conversion; existing repo files preserved |
| Agent edit | Actual changed file renders; chat prose alone does not pass |
| Permission denial | Denied action not executed; waiting state clears correctly |
| Cancellation | Run terminates/interrupts visibly; partial output not called complete |
| External change | Valid file update appears; malformed write does not erase last valid view |
| Revision conflict | Both candidate and newer work retained in both completion orders |
| Explicit execution | Opening a project never invokes its generator or firmware |
| Units/part identity | Invalid units/quantities rejected; supplier change preserves definition |
| Parts reuse/inventory | Same definition reused across two projects; owned quantity remains distinct from each BOM; exported project does not require original library |
| Tools catalog | Catalog/search/reuse a tool across projects; separate required equipment from BOM stock; no ownership inferred from opening a tutorial |
| Kinematic fixture | Constraint residual/branch/reachability tested against known cases |
| Evidence | Animation cannot silently acquire physical-test label |
| Publication failure | Existing public release ID and artifact set unchanged |
| Authorization | User B cannot publish/read private A artifacts by changing IDs |
| Discovery equivalence | Documents-only fixture AND mechanism fixture each reachable by menu and spatial gallery |
| Accessibility | Full non-pointer-lock path, Escape and readable narrow-screen views |
| Local independence | Reading/editing/exporting works while hosted service unavailable |

Local alpha acceptance: install documented prerequisites, open fixture, connect
agent, request change, inspect result, handle stop/error, export source/presentation.
Public MVP acceptance adds authenticated publication, useful anonymous page,
source/remix journey and spatial/list discovery. Manual posting to X remains the
user's action. Usage/viral claims require real observations, not test passes.

Release rollback: pin package/adapter versions; retain previous local project
schema support; no in-place destructive migrations. Hosted deployment can revert
to prior compatible build while immutable releases remain available. Use additive
migrations first; do not promise database rollback after destructive schema edits.
The first bottlenecks to measure are local geometry generation/rendering, file
watch bursts, and hosted media bandwidth. Use bounded loading/pagination and
lazy 3D; no speculative distributed processing or 100x infrastructure.

## Work packages and dependencies

Effort S/M/L is provisional, not a calendar promise. Each package delivers tested
behavior; integration starts early rather than assembling isolated stubs at end.

| WP | Ownership / proposed files | Deliverable and gate | Depends | Size |
| --- | --- | --- | --- | --- |
| 0 | `experiments/` planning spikes, exact paths assigned later | ACP permission/edit/cancel; candidate conflict proof; bounded geometry/kinematics evidence | Reviewed spike scope | M |
| 1 | `packages/core`, documents fixture | Schemas, units, manifest/BOM validation, portable project and agent conventions | WP0 contract decisions | M |
| 2 | `packages/workshop` | Public scaffold/validate CLI, local host, files/revisions, candidate lifecycle and preview events | WP1, revision remedy | L |
| 3 | `packages/agent-acp` | Tested Codex path, protocol failure coverage, capability matrix | WP0, WP2 contract | M |
| 4 | `apps/studio`, basic `packages/viewers` | Describe/open, agent panel, document/media/code/parts views | WP1–3; reviewed design | L |
| 5 | Model viewer + mechanism fixture, remaining fixtures | Selected visualization/kinematics and honest fidelity labels | WP0/1/4 | M |
| 6 | Local packaging/docs/share export | Reproducible repo-first and Studio setup, source and presentation export | WP4/5 | M |
| 7 | `apps/web` server and hosted migrations | Auth, immutable publish, SSR project page/source, authorization tests | WP1/6; storage decision | L |
| 8 | Hosted discovery views | Search/list plus Three.js workshop exploration | WP7 + shared viewers | M |
| 9 | Integration tests/release docs | Full creation/share/remix acceptance, review fixes, license/release checks | WP6–8 | M |

Execution uses Sol 5.6 work packages by default; root owns design, decomposition
and review. Each dispatch enumerates a CLOSED exact file allowlist, not the broad
module ownership above. Workers are told they are not alone, must preserve others'
changes, may not refactor adjacent code or stage/commit, and must stop if they need
another file. Shared data additions are append-only. Sequence shared hub files;
parallelize independent viewers/fixtures only after common contracts settle.
Root audits changed paths and actual hunks and reruns relevant checks. No blanket
reverts of shared files. If Sol is unavailable, root implements that package.

## Review preparation and outstanding choices

The [reality-check review](../research/mvp-reality-check.md) identifies a material
acceptance gap: existing software gates could pass without a successful physical
build. Proposed remedy is one complete builder pilot with exact hardware/toolchain,
manual deployment, observed test and meaningful modification before broadening
the implementation. This recommendation and initial project selection remain
pending; the full public/discovery scope is retained.

The first full engineering pass must address architecture/contracts, code quality,
tests and performance, with extra attention to candidate adoption, execution trust,
local-server access, and hosted publication authorization. Design review must
cover information hierarchy, all states, user journey, visual direction, design
system, accessibility/responsiveness and remaining decisions. Visual mockups are
required before calling visual design approved; this text is not a UI review.

Known unresolved findings must be presented individually under the active review
workflow. No implementation begins merely because a work package appears here.
After reviewed remedies are incorporated, run an independent adversarial pass
against scope, consistency, completeness, clarity and feasibility.

## GSTACK REVIEW REPORT

| Review | Status | Evidence |
| --- | --- | --- |
| CEO | IN PROGRESS | D1–D12 and user refinements in foundation plan |
| Architecture research | DOCUMENTATION PASS COMPLETE | Broad format matrix, small v0 recommendation and 5 proposed fixtures; no runtime spikes |
| Engineering | TARGETED LOCAL REVIEWS COMPLETE | Local contracts, implementation and repair review; hosted scope not reviewed for launch |
| Design | LOCAL REVIEW AND BROWSER QA | Targeted plan review and live desktop/mobile inspection; public discovery remains planned |
| Independent draft review | 2 ROUNDS, CONCERNS | Initial 8/10; reviewer confirmed two omissions resolved; public active-content boundary remains open |
| Implementation | LOCAL V0 IMPLEMENTED | Next.js Studio, filesystem projects, catalog ingestion, ACP, tutorials and tests; final gates in local plan |

**UNRESOLVED DECISIONS:**
- Candidate adoption and external-edit race protection; publication ordering.
- Public preview sanitization and active-format download isolation, raised by independent reviewer.
- Executable artifact trust and local agent/tool isolation.
- v0 geometry/CAD/kinematic tools and supported fidelity.
- Hosted auth method, private storage and publication authorization.
- License, supported install platforms, hero example and visual design.
- Exact tested ACP/adapter versions; documented support is not live validation.
