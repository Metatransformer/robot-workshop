# Workshop foundation

Status: In-progress CEO review; implementation not started.
Date: 2026-10-17
Mode: HOLD SCOPE

## Product direction

An agentic invention workshop helps people learn how to design, build, program,
test, and improve robots, mechanisms, and devices. The primary artifact is an
invention project. It can be useful without a simulation or a 3D scene.

The project can contain research, requirements, documents, sketches, pictures,
schematics, CAD, parts specifications, source code, firmware, build guidance,
experiments, measurements, and selected executable models. Simulations answer
particular questions; they do not define the whole product.

The conversational companion can create and revise these artifacts, research
parts, explain decisions, and help troubleshoot physical builds. Incomplete
information and failed experiments are expected and must remain understandable.

## Entry experience and discovery

The user arrives at the website and can either describe an invention immediately
or explore other people's published workshops, projects, and templates. Discovery
supports a 3D view navigated with WASD and mouse, as well as a searchable menu.
These are views of the same published content. Workshops visually represent their
creators' mechanisms, machines, gizmos, and other project artifacts.

The 3D discovery environment is not a requirement to physically simulate every
displayed invention. A project may open to documents, illustrations, source code,
designs, or selected simulations. Publishing and sharing lead new visitors back
into exploration and creation. The user explicitly added this discovery
experience; holding scope includes this clarified requirement.

Explicit user clarification: inventions need not have 3D geometry at all. A
workshop can display plans, images, documents, or code as flat presentations in
the spatial environment. A 3D model, animation, or simulation is never a
prerequisite to creating, publishing, discovering, or remixing an invention.

## User requirements and constraints

- Well-designed TypeScript and an agentic development workflow.
- Next.js web frontend with search-friendly public content.
- Three.js for the spatial workshop discovery experience and useful project views,
  with WASD/mouse exploration and an alternative searchable menu.
- A path to an Electron application later.
- Supabase authentication and Supabase Postgres for application data, explicitly
  requested instead of MongoDB. This project-specific instruction supersedes the
  global MongoDB / no-Supabase-app-tables preference. Other global constraints
  remain: server routes enforce authorization, privileged keys stay server-side,
  and no application RLS policies or direct browser database access.
- A local agent harness that can invoke Codex to write project code.
- Local agent execution for the prototype. Seamless platform-managed website
  creation remains a later product direction, not an initial implementation
  requirement; see D9 below.
- An open-source toolkit/language direction, with reusable project and part assets.
- A library of varied use cases to test the foundation's expressiveness.
- Ingestion of component specifications and a growing parts library, supporting
  both internal parts and links to ecommerce suppliers.
- Virtual designs and physical inventory are distinct; reusable definitions and
  particular owned components must not be conflated.
- Shareable creations and explanations, with clear distinctions between simulated
  behavior and observed physical results.
- Reuse established engineering standards and tools where they fit.

## Review decisions so far

- D1: Proceed directly with CEO review, using the supplied references instead of
  first running office-hours. User selected B.
- D2: The user clarified the proposed portable foundation into an invention
  project spanning documents, designs, code, and optional simulations, then
  instructed the review to continue. Carry this product framing forward.
- No particular simulation format, engine, packaging standard, or execution
  environment has been approved as the technical foundation.
- D3: SELECTIVE EXPANSION. User selected B. Preserve stated scope, evaluate
  correctness thoroughly, and present optional expansions individually.
- D4: Defer interactive build checkpoints. User selected B. Generated build
  guidance and experiment notes remain in scope; a dedicated resumable checkpoint
  workflow is deferred.
- Sharing is a core part of the invention cycle, not a secondary output. User
  specifically named Spawn (https://spawn.co) as product inspiration for seamless
  creation and pervasive shareability; research its actual experience.
- D5: Skip dedicated live co-building. User selected C. Publishing, sharing,
  remixing, and exported source remain in scope; a simultaneous multiplayer
  authoring session is not part of this plan.
- D6: Defer a dedicated alternative-design comparison interface. User selected
  B; ordinary agent-authored comparison documents remain supported.
- Mode changed to HOLD SCOPE at the user's direction after D6: maintain the
  existing scope to get the product built. Stop proposing optional features.
  Preserve agreed requirements and evaluate only their architecture, correctness,
  usability, and delivery. This supersedes D3's selective-expansion posture.
- D7: Files are authoritative. User selected A and clarified that the project
  files are the code written by the agent. Do not create a competing editable
  database representation of authored file contents.
- User selected Supabase instead of MongoDB for application data.
- User clarified the entry journey: prompt immediately OR explore published
  workshops and templates, through 3D navigation or a searchable menu.
- D8: Local Codex during development plus platform-managed hosted execution for
  website creation. User selected A and explicitly required a seamless hosted
  experience like Spawn. The website controls its agent. Both runners edit
  project files; hosted provider, isolation implementation, and deployment vendor
  remain technical choices to evaluate.
- The user reiterated that spatial discovery does not make every invention 3D:
  plans and other non-3D artifacts are complete, valid projects on their own.
- D9: User redirected the prototype toward local execution to avoid spending
  this phase solving cloud agents, BYOA, and inference funding. Defer those
  implementations; preserve a narrow replacement boundary. This supersedes D8's
  hosted-execution requirement for the prototype, not the eventual product vision.
  No hosted provider or billing model has been selected.
- The user is considering an open-source launch to get the product off the
  ground. Recommend a locally runnable creator prototype as the first release;
  release packaging, license, and actual publication remain undecided.
- D10: User selected A: establish the open-core boundary now; treat maintained
  parts knowledge as a commercial hypothesis rather than a launch dependency.
  User explicitly made spread on X a critical product success criterion. Design
  and test the sharing loop; do not claim or guarantee viral distribution.
- D11: User clarified the intended revenue model: affiliate revenue when people
  buy parts, potentially through a hosted purchasing library for inventions and
  equipping their physical workshops. Purchasing integrations, affiliate systems,
  and shipping/fulfillment are deferred. Users can source and buy everything
  themselves at launch. This supersedes the proposed paid parts-knowledge service
  as the primary commercial direction; revenue viability is not yet validated.
- D12: User accepted ACP as the integration direction and explicitly requested
  engineering reviews, design reviews, and subagent work toward the full MVP plan
  and eventual build. Protocol/adapter compatibility still requires a live spike;
  accepting ACP does not imply every agent's authentication and features work.
- D13: User explicitly requested open-format interoperability research, including
  using project artifacts in Blender and other open-source tools. Prefer existing
  formats and toolchains; distinguish editable native sources from derived
  previews/exports. The requested research does not add every format as a required
  MVP integration or make lossy conversion acceptable.
- D14: User explicitly requires repository-first creation: open Codex, Claude
  Code or another coding agent, create an ordinary Git repository and build a
  Metatransformer project directly, analogous to starting a Godot project. Studio
  is optional for creation and can open the same project later. The public toolkit
  must expose scaffolding, conventions and validation without a Studio session,
  hosted account, ACP client or private application API.
- D15: User requests subagent research into real current maker projects using AI
  and consumer technology, to form an end-to-end tutorial library that progresses
  from simple open/modify/build examples toward more complex inventions. Explicit
  interests include cyberdecks and LLM-enabled robots. Examples must distinguish
  real documented builds from our proposed templates; not every example needs
  runtime AI or a simulation. The initial library may start small.
- D16: User reiterates a growing catalogued parts AND tools library. This is a
  personal cross-project workshop resource, not only per-project BOMs. Tutorials
  and agent workflows should reuse and add to it; requirements, reusable
  definitions, actual owned items, and tools/equipment remain distinct.

## Local prototype and future hosted execution

Design direction following D9: the browser talks to the workshop server, which
starts an agent run through a small runner interface. The initial runner invokes
local Codex against an invention's working directory. The browser never knows
shell commands, local filesystem paths, or provider credentials. Keep this local
service restricted to loopback; it is not a public shell endpoint.

The runner contract needs only start, observe events, and cancel. Inputs identify
the project, its base revision, and the user's instruction. Events report progress,
changed artifacts, completion, cancellation, and errors. Use stable project/file
identifiers in this contract; resolve filesystem paths inside the local adapter.
Provider-specific process details remain inside that adapter. Do not implement a
general plugin framework, remote scheduler, MCP server, or multi-provider router.

Project files, revision handling, artifact previews, and publication validation
belong to the workshop, not the runner. A completed run returns candidate changes
against its base revision; it does not silently publish or overwrite a newer
revision. The same project artifact conventions apply to documents, pictures,
code, and optional simulations regardless of where an agent runs.

Later, a hosted adapter can prepare a workspace from a revision, run the agent in
isolation, and return artifacts/events through this same boundary. This preserves
the UI and project format; it does not eliminate future work on authentication,
isolation, storage transfer, quotas, or billing. Do not build those systems now.

Open-source local release is the recommended first distribution to evaluate.
Users run the application and use their own installed/authenticated Codex; this
avoids platform-funded inference but entails local setup. A deployed public site
cannot invoke a visitor's local shell without an explicitly installed connection.
Public discovery and hosted creation are separate release capabilities; do not
advertise seamless hosted generation as part of a local-only prototype.

This change does not remove Next.js, Three.js, Supabase, shareable project files,
or the discovery vision. The engineering review must specify which local workflows
work without configured hosted services and what setup the first release needs.

## Open-core product boundary — D10 direction accepted

User direction: Metatransformer is the environment existing agents use for
physical invention. Core workshop is open source and local-first. Support agent
portability rather than creating a proprietary reasoning loop. Cloud services
can form a business later; no cloud agent work is added to the prototype.

Keep three responsibilities distinct:

1. External agent: reasoning, planning, authoring, research, troubleshooting.
2. Open workshop toolkit: portable project conventions, artifact inspection,
   parts definitions, validation, exports, and adapters to selected domain tools.
3. Open Studio: visual workspace, project management, file previews, and supported
   agent conversation adapters. The workshop works without a platform account.

The toolkit is not a promise to implement a universal mechanical/electrical/
firmware simulator. Documents-only projects remain first-class. Selected models
answer particular questions; animation is not evidence of physical feasibility.

Compatibility has two levels: any file-capable agent can edit documented project
files and invoke workshop commands; an integrated conversation panel requires an
adapter for that agent's supported interface. Ship one integrated adapter first.
Do not advertise identical integration for Claude Code, Codex, OpenCode, and local
models before verifying and implementing their interfaces.

Recommended open/hosted boundary (proposed, not a paid-feature implementation):

| Open core, usable locally | Optional hosted services |
| --- | --- |
| Studio and local project files/history | Public discovery, hosted releases and share links |
| Local component definitions, manual spec import, inventory | Maintained parts/specification search and supplier information |
| Local validation, previews and selected simulation adapters | Later paid compute if users demonstrate demand |
| Agent adapters and documented CLI/tool contracts | Later organizational hosting and administration |
| Standard exports and artifact provenance | Managed backup/storage convenience |

Do not paywall reading or exporting a user's own invention, editing their own
parts, using their own agent, or running an available local validator. Hosted
clients are optional adapters: the local core must not import cloud-only service
implementations. Supabase belongs to hosted accounts/catalog/publication; core
authoring must not require Supabase credentials or network access. This is a
proposed resolution of the earlier Supabase setup question for engineering review.

Supporting service hypothesis: a maintained parts and build-evidence service.
Its potential value is source-backed normalized specifications, refreshed supplier
offers, and evidence about which parts work together under stated conditions.
The defensible asset would be maintained data and permissioned physical-build
evidence; generic agent-generated descriptions alone are not a moat. Compatibility
claims must distinguish extracted, inferred, calculated, and physically observed
evidence. Do not describe records as verified without supporting evidence.

Keep reusable part definitions separate from supplier offers, owned instances,
and compatibility evidence. Projects pin/copy the allowed specification snapshot
they depend on and retain source/date information; an expired subscription or
missing service must not break existing project files. Data rights and update
semantics require review before choosing source feeds or redistributing datasets.
User projects remain private unless deliberately shared; no automatic ingestion
of private designs or experiments into a commercial dataset.

Public sharing/discovery is the distribution hypothesis. Following D11, the
primary commercial direction is affiliate purchasing through an optional hosted
parts service, rather than a required subscription for parts knowledge. Affiliate
economics and the cost of maintaining reliable data have not been validated.
Team features, paid compute, marketplace transactions, and billing remain future
candidates, not prototype requirements. Dedicated live co-building remains
excluded under D5.

### Purchasing boundary — D11

At launch, users maintain local part definitions and project bills of materials,
record quantities and specifications, attach ordinary supplier URLs, and purchase
items themselves. The project remains useful with internal, salvaged, custom,
already-owned, or unlinked parts. A hosted purchasing catalog is not required to
create a part or complete a project.

Later, an optional purchasing service can resolve part requirements to supplier
offers and affiliate links, supporting both project needs and workshop equipment.
Supplier offers are separate from technical part definitions and physical owned
items; changing a vendor or link must not change the invention's requirements.
Do not require a global catalog ID on locally defined parts. Preserve these
boundaries now without implementing a commerce platform.

Technical suitability must remain independent of affiliate eligibility. Users
can choose their own suppliers and export their bill of materials. Affiliate
relationships should be clearly disclosed when introduced. No current commission
rates, supplier partnerships, coverage, inventory availability, or revenue are
assumed. Buying parts does not establish that an invention is validated.

Shipping/fulfillment is a separate future decision. Affiliate referrals alone do
not mean Metatransformer accepts orders, handles payments, stocks parts, ships
packages, or manages returns. Do not introduce any of those obligations into the
prototype. The user's mention of shipping records a future possibility, not a
decision to become a merchant or fulfillment provider.

Relevant precedents: Excalidraw separates its open editor from managed workspace
services (https://plus.excalidraw.com/pricing); GitLab documents a buyer-based
open-core boundary (https://handbook.gitlab.com/handbook/company/stewardship/).
These illustrate boundaries, not proof of demand for Metatransformer.

License selection is still pending. Software, project templates, part datasets,
third-party assets and user inventions need distinct licensing treatment; using
the workshop must not silently relicense user projects. No license has been
selected or publication authorized by this proposal.

## Sharing and X distribution — launch criterion

User direction following D10: the product needs to spread on X. Treat sharing as
part of the core creation experience, not a marketing task appended at launch.
Virality is an outcome to measure, not an implementation guarantee. This does not
authorize posting to X or publishing private project files on the user's behalf.

Proposed loop: an understandable invention result appears in a post; a visitor
opens its public project page; they inspect how it works and what is known; they
download/remix it locally with their own agent; their improved result can be
shared in turn with attribution and a reference to its source revision.

The shareable result must suit the artifact. A mechanism can have a short motion
demonstration; a documents-only project can have a clear illustrated build sheet,
wiring diagram, or before/after design. No invention must acquire 3D geometry or
simulation just to qualify for sharing. Clearly label animation, simulation, and
physical demonstrations. Choose initial example projects for understandable,
visually legible outcomes, reproducible source, and realistic scope.

Local creation and share-asset export should work without hosted inference.
Hosted public project pages are a separate thin publishing capability: explicit
publication of selected artifacts at a revision, useful previews, source/remix
access subject to the project's license, and an accessible web explanation.
Public viewing must work without installation, login, or loading the 3D world.
The local installation step remains a conversion risk to test honestly; no
browser-based agent authoring is implied by a public project page.

Evaluate early launch examples by downstream behavior: voluntary shares, visits
to the project, source downloads, successful local opens, and subsequent remixes.
Views and likes alone do not establish that the workshop is useful. No arbitrary
viral threshold or growth claim is accepted without an observed baseline. Measure
local activation only through explicit opt-in reporting or direct user research.
No feed algorithms, referral rewards, X automation, or cloud-agent infrastructure
are added to the prototype by this requirement.

## Approved source-of-truth boundary

Authored project documents, designs, code, and assets are ordinary versioned files.
The workshop presents and helps edit these files; it does not replace them with an
opaque application-only document format. Web previews and search indexes derive
from a selected revision. Publication validates included files and references
before replacing the public version; a failed publication reports the error and
preserves the previous release, as proposed in accepted option D7-A.

Under the later local-first decisions, local project and inventory records must
remain usable without Supabase. Supabase Postgres owns hosted application records
such as account ownership, public catalog, and release/index metadata; it does not
become a second editable authority for local part definitions or project files.
Exact schema, file/blob storage, revision implementation, and execution isolation
remain to be designed. The platform's own source repository is distinct from each
invention's agent-authored files.

## NOT in scope

- Dedicated live co-building: user explicitly declined simultaneous human/agent
  authoring sessions in D5. Do not introduce presence, shared cursors, real-time
  collaborative editing, or multiplayer workshop infrastructure under the guise
  of basic sharing. This does not remove normal consistency requirements for
  asynchronous agent edits and user changes.

## Deferred scope

- Interactive build checkpoints: a dedicated resumable workflow for recording
  expected observations and outcomes while following build instructions. Keep
  generated guidance and ordinary experiment notes in the baseline. Revisit when
  builders need structured help resuming physical builds. Depends on project
  revisions and evidence attachments; estimated M, priority P3. Recorded in
  ../../TODOS.md.
- Dedicated alternative-design comparison interface: explicitly deferred in D6.
  Support comparisons as ordinary documents; revisit a specialized view only if
  repeated real use demonstrates the need. Recorded in ../../TODOS.md.

## Spawn product research — 2026-10-17

Scope: inspected the live public homepage, INKBLADE detail presentation, and
Create entry; read official product and agent documentation. No prompts, imports,
publishing actions, or collaboration requests were submitted. Opening Create
automatically provisioned or opened a guest-style den under a generated handle;
it presented Savi in the scene without a preceding sign-in prompt. Account
persistence and authenticated authoring were not tested.

Direct UI observations: creation cards dominate the homepage; discovery includes
staff picks, current activity, and recent updates. A creation detail emphasizes
imagery, creator identity, a short description, and Play. The Create entry leads
to an embodied companion and a conversation affordance rather than a project form.

Official documentation says published links retain a released version while
editing continues, reusable tools/content can be mods, and external coding agents
can work on project Git repositories. These are documented capabilities, not
end-to-end verified workflows. Source: https://www.spawn.co/about and
https://www.spawn.co/llms.txt .

Interpretation for the workshop: sharing belongs throughout creation. A project
needs a public presentation appropriate to its artifacts: drawings, pictures,
explanations, code, physical results, or an optional interactive model. A visitor
should understand the invention before needing the full authoring environment.
The user's requirement already includes shareability and remixable creations;
these are not new expansion proposals.

Architecture implications to review, not yet approved technical remedies:
separate editable working state from released public material; make source
artifacts available to the agent with inspectable results; maintain a distinction
between public explanations and private workshop information. Do not equate
source access or duplicating one's own game with unrestricted remix rights.

Research limits: no independent market ranking or viral growth metrics verified;
the observed product mechanisms support a sharing hypothesis, not a measured
growth claim. Do not automatically copy Spawn's multiplayer, pricing, publishing
permissions, or runtime design into the workshop.

## Repository audit

The working directory was empty and was not a Git repository at review start.
There was no existing application, package manager lockfile, architecture,
history, stash, or repository design document to reuse. Global user instructions
apply. No implementation changes have been made.

## Research completed so far

A documentation-based research pass was delegated to gpt-6-astra with xhigh
reasoning. It evaluated specialized device representations and recommended
examining a portable package that preserves domain models. This preceded the
user's clarification that documents and build guidance are first-class outputs.
It is research input, not an approved architecture or experimental validation.

Established standards to assess within the broader project:

- glTF: https://www.khronos.org/gltf/
- SDF: https://sdformat.org/
- MJCF: https://mujoco.readthedocs.io/en/stable/modeling.html
- Modelica: https://modelica.org/
- FMI: https://fmi-standard.org/docs/3.0.2/
- SSP: https://ssp-standard.org/docs/2.0.1/
- FMI WebAssembly initiative: https://github.com/modelica/fmi-ls-wasm
- Wokwi component extension precedent:
  https://docs.wokwi.com/chips-api/getting-started

Research findings to evaluate, not settled remedies: different domains have
different connection semantics; conversions can lose information; executable
models have host requirements; model fidelity depends on the claim and operating
conditions. SSP addresses simulation system packaging, which does not by itself
establish its suitability as the container for an entire invention project.

## Next review work

The full execution-plan draft is in [metatransformer-mvp.md](metatransformer-mvp.md).
It translates the accepted scope into proposed contracts, states, verification,
and dependency-ordered work packages. Engineering and design reviews are pending;
its unapproved technical proposals are explicitly marked. Open-format research
is complete as a documentation pass in
[open-format-landscape.md](../research/open-format-landscape.md), with a proposed
small v0 profile and explicit native-tool fixture tests. Format/runtime selection
and live interoperability verification remain pending.

### Agent integration research — D12 direction accepted

Research found Agent Client Protocol (ACP), an existing client/agent protocol
covering session setup, prompts, streamed updates, permission requests, and
cancellation. Optional capabilities include session loading, filesystem and
terminal operations. User accepted this direction in D12. Specific dependencies,
versions and live adapter behavior remain unverified.

Primary sources:
- https://agentclientprotocol.com/protocol/v1/overview
- https://github.com/agentclientprotocol/codex-acp
- https://github.com/agentclientprotocol/claude-agent-acp
- https://opencode.ai/docs/acp/

The Codex adapter documents translation to Codex app-server; the Claude adapter
uses Claude Agent SDK; OpenCode documents an `opencode acp` subprocess. These are
distinct implementations with different capabilities and authentication behavior.
Codex and Claude executables were found locally; OpenCode was not found on PATH.
No adapters were installed, authentication exercised, or inference invoked.
Repository main-branch documentation is not proof of released-version support.

Proposed structure:

```text
Studio browser UI
  -> local workshop service
     -> agent session adapter (candidate: ACP client)
        -> user's selected local agent
     -> project files / validation / artifact previews

Optional hosted publishing reads explicitly selected release artifacts.
```

The browser receives product events rather than raw provider credentials or
process controls. ACP's absolute filesystem paths stay inside the local service
and agent connection; public project manifests use portable relative references.
Pin a tested protocol/adapter release and negotiate supported capabilities. Do
not depend on draft or vendor-specific extensions for the first integration.

The earlier start/observe/cancel sketch is incomplete for an interactive agent:
the application must surface and respond to permission/authentication requests
and distinguish waiting for input from executing or failed. An approval must
never be silently granted by an adapter. ACP is communication, not an OS sandbox;
the engineering review must trace both agent-owned shell/file tools and optional
client-provided tools before describing filesystem confinement.

Recommended decision to consider: use ACP as the first integration path and
verify Codex before broadening the tested agent list. Direct native integration
remains an alternative if the test exposes a material missing capability. Agents
outside the tested list can still work through ordinary project files and CLI
commands. Switching agents starts a new agent session against the same project;
cross-provider conversation-memory portability is not promised.

Prototype acceptance for the chosen path: send a prompt, observe an artifact
edit and its preview, answer a permission request, cancel a run, and recover
visibly from agent exit or missing authentication. Local credentials remain with
the agent's supported authentication flow. No claim that all subscription plans
can fund every adapter is made. MCP tool exposure remains deferred; ACP does not
require building a workshop MCP server.

Hold the established product scope. Prepare the solutions architecture and reuse
comparison, resolve necessary technical decisions, and run an engineering review
on the resulting concrete design. Do not add optional features or hypothetical
capacity work. Feasibility experiments require a separately defined execution
scope; no experiments have been run yet.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | /plan-ceo-review | Product scope and foundation | 1 in progress | IN PROGRESS | Project-first framing; HOLD SCOPE supersedes selective expansion |
| Architecture research | User request | Existing formats and reuse | 2 | PRELIMINARY | File-based source accepted; domain models and execution remain under review |
| Eng Review | Requested follow-on | Architecture and verification | 0 | NOT RUN | Concrete design required |

**VERDICT:** Review in progress; eng review required. No implementation approval or completed review is claimed.

**UNRESOLVED DECISIONS:**
- Detailed technical architecture, file storage, and format/runtime choices remain undecided.
