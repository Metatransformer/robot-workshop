# Metatransformer

A local workshop for physical invention. Bring a coding agent, collect real parts,
write engineering plans, and build a project you can take into ordinary tools.

## Run the workshop

Requires Node.js 22+ and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000. The first launch creates a private `.workshop/` directory
with examples and a parts/tools catalog. No account or model credentials are needed
for project files, the mechanism view, or document ingestion.

Start with the four-bar linkage: change the crank length, play the motion, and read
the engineering plan. Every starter includes a plain-language Start here guide, a
32-term glossary, and a linked learning path. You can go straight to the technical
files at any time. Explore also contains a servo desk creature, a sensor project,
a cyberdeck planning starter, and a blank project.

## An invention is a directory

```sh
pnpm workshop init /path/to/my-invention --template sensor --title "My sensor"
pnpm workshop validate /path/to/my-invention
pnpm workshop register /path/to/my-invention
```

Open that directory in Codex, Claude Code, or your editor. The agent reads `AGENTS.md`
and updates ordinary source files. `ENGINEERING.md` carries requirements, interfaces,
assembly steps, validation, and unknowns. The manifest is versioned JSON. Markdown,
firmware, CAD and other native files remain usable outside Studio.

Studio previews PNG/JPEG/WebP images and self-contained GLB models, alongside
selected interactive mechanisms; it is not a universal mechanical,
electrical, or thermal simulator. A moving model does not establish buildability.
Each template states what remains to be checked on real hardware.

## Real parts and your own tools

The catalog distinguishes what a project requires from what you own. Starter parts
link to manufacturer documentation; quantities start at zero. Add tools, edit your
inventory, or import a PDF/text datasheet up to 24 MiB. Review the source beside extracted fields
before saving. Edited claims are marked manual. Scanned PDFs require manual text
entry; the prototype does not include OCR or crawl supplier sites.

Supported starter components also show exact supplier references and required,
recorded-owned, and remaining quantities. Review the variant notes and complete the
consumables list before ordering through the supplier. Prices, availability, carts,
payment and affiliate fulfillment are not integrated.

## Learn, investigate, and test

Open `/learn` for 48 applied modules across measurement, electronics, mechanics,
embedded programming, control and robotics. Worked examples, reasoning checks,
bench exercises and a 254-term glossary connect to project learning paths. Reading,
practice and recorded bench demonstrations are separate; browser-local progress
can be exported and restored. This is an initial curriculum, not a complete degree
or evidence that the example hardware has been physically tested.

`/explore-objects` breaks down six everyday systems into energy flow, signals,
subsystems and small experiments, with candidate parts and links back to projects.
These studies are starting points, not complete appliance assembly instructions.

`/labs` provides bounded RC, DC motor, power-budget and GPIO state-machine models.
Models expose assumptions and limitations; the GPIO lab is not a microcontroller
emulator. Record actual bench observations separately from predictions.

Lessons and selected project files can be printed or saved as PDFs. Build packets
include parts and evidence records; source-code files remain literal code. The
current PDF format omits images and disables project-relative links, so share the
source bundle as well when the build depends on diagrams or other files.

## Bring an agent

See [agent setup](docs/agent-setup.md). Studio uses ACP over local stdio, with explicit
permission decisions and live events. Agent changes run in a new result directory;
opening a result keeps the original project. A separate directory is not an OS
sandbox: the agent's own execution permissions still apply.

The bundled Codex ACP adapter is a separate open-source dependency. Authenticate
using the provider's supported local flow. Claude and OpenCode adapters are optional.
No hosted inference, free token pool, or proprietary agent is required.

## Local storage and exports

Set `METATRANSFORMER_HOME` to move the catalog/project registry. Use `PORT` when
changing the listening port. Local APIs require a process token and a matching local
origin; don't expose this development server through a public tunnel.

UI file saves create a result copy. Export source downloads a portable JSON bundle
with selected source files and referenced part definitions. Imports validate hashes
and create a new project identity without overwriting an existing directory. It excludes the global inventory and agent
transcript; review your project content before sharing it.

```sh
pnpm workshop export /path/to/my-invention /path/to/new-bundle.json
pnpm workshop import /path/to/new-bundle.json /path/to/new-invention
pnpm workshop register /path/to/new-invention
pnpm typecheck
pnpm test
pnpm build
```

## Product and engineering plans

- [Concrete local implementation](docs/plans/local-build-engineering.md)
- [Full MVP scope](docs/plans/metatransformer-mvp.md)
- [Tutorial ladder](docs/plans/tutorial-library.md)
- [Open formats research](docs/research/open-format-landscape.md)
- [Real builds research](docs/research/real-world-build-examples.md)

Hosted accounts, public project pages, remix/discovery, social presentation exports,
and the purchasing service are separate planned layers. Local development does not
require cloud credentials. This repository has not been published as a release;
license selection and third-party attribution review precede that release.

## Browser checks

Start Studio on the test port in one terminal (`PORT=3100 pnpm dev`), then run
`pnpm test:e2e` in another. Install the matching browser once with
`pnpm exec playwright install chromium`. These local acceptance tests create QA
projects and catalog items in the running workshop; use a separate
`METATRANSFORMER_HOME` for disposable test data. The native-artifact test must use
the same `METATRANSFORMER_HOME` as the server.
