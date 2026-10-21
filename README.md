# AI Robot Workshop

AI Robot Workshop is an open source, local-first physical invention and learning
portfolio prototype by Nick Bryant. Bring a coding agent, collect real parts, write
engineering plans, and build a project you can take into ordinary tools.

- [Source on GitHub](https://github.com/Metatransformer/robot-workshop)
- [Hosted showcase](https://robot-workshop.vercel.app)
- [Project article](https://metatransformer.com/blog/ai-robot-workshop)

See [the delivery handoff](docs/DELIVERY.md) for the guided starting path, verified capabilities and remaining limitations.

## Hosted showcase and local workshop

The hosted showcase presents the learning, lab, guide, and browser-local worksheet
surfaces. The complete workshop runs locally so project and agent operations stay
on your machine.

| Capability | Hosted showcase | Local workshop |
| --- | --- | --- |
| Learning modules, object studies, labs, and build guides | Yes | Yes |
| Browser-local learning progress and worksheets | Yes | Yes |
| Create, edit, validate, import, and export project directories | No | Yes |
| Parts/tools inventory and specification ingestion | No | Yes |
| ACP coding-agent sessions and permission decisions | No | Yes |
| Access to local project files and workshop APIs | No | Yes |

## Clone, install, and run locally

Requires Node.js 22+ and pnpm 10.

```sh
git clone https://github.com/Metatransformer/robot-workshop.git
cd robot-workshop
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

The sensor starter has a [buying and assembly supplement](src/lib/sensor-build-guide.ts)
at `/build-guides/sensor`: exact supplier candidates, cable/header choices, package
versus used quantities, breadboard checks, and source-bundle handoff. New sensor
projects include the same `BUY_AND_BUILD.md`; existing project files stay intact.

The separate `sensor-led` starter adds a red LED and series resistor to the Pico +
BME280 build. Its printable guide at `/build-guides/sensor-led` includes exact parts,
six-wire requirements, a current estimate with assumptions, explicit room-temperature
threshold checks, and separate records of commanded output and observed light.
The source bundle includes both CircuitPython files. Three startup pulses precede
sensor initialization; sensor faults command the LED off. This route is unbuilt.

The separate `servo-bench` starter has a printable guide at `/build-guides/servo`,
exact FS90 supplier references, power and wiring plans, and original CircuitPython
hold-to-run firmware. Its learning path connects power, torque, PWM and state
machines. The controller starts disarmed and stops pulses on release or timeout;
software tests do not establish physical motion, electrical behavior or torque
release. This unloaded bench route has not been physically built or validated.
Creating a starter adds missing BOM definitions to the local catalog while
preserving existing inventory records and project files.

At `/labs/servo`, predict the FS90 starter's response to a normal press, a button
held at boot, a too-short release, or the five-second timeout. Step through the
command trace and compare it with one ideal 20 ms PWM frame. The browser model is
differential-tested against the exported Python controller; it models commands,
not servo angle, torque, electrical load or physical validation. Links from the
build guide, PWM lesson and labs connect the exercise to the actual starter.

At `/labs/hysteresis`, predict the external LED starter's commands, then step
through retained state, threshold chatter, faults and restart. Compare with a
single-threshold rule in a readable state table. Sample decisions are checked
against the exported Python; startup pulses and physical temperature/light behavior
are outside this model. Open it from the LED guide, state lesson or labs.

At `/labs/sensor-wiring`, inspect four Pico/BME280 connection diagrams, diagnose
swapped signals, missing ground or a wrong supply endpoint, and choose an unpowered
check. A separate breadboard exercise teaches isolated five-contact strips. Physical
pin numbers and GPIO names are shown separately, with manufacturer references.
This compares the starter's four connections; it does not simulate electrical
behavior or certify real wiring. Open it from the sensor guide or I2C lesson.

At `/bench/sensor`, paste or import the starter firmware’s serial CSV, inspect
separate recording segments and scatter plots, and export readings plus bench
observations. Diagnostics and source line numbers remain in the JSON report.
Version 1 observation JSON reports can be restored locally after a preview and
explicit replacement confirmation. Restoration retains notes, recorded provenance
and original segment numbering; it restores only the exported segment, not the
absent original CSV or other segments. Reports up to 16 MiB are supported.
This is a browser-local manual capture workflow; notes must be exported before
closing the tab. Edited notes are tracked per segment, with navigation/reload
warnings where the browser supports them. Exporting readings CSV does not mark
notes exported. If you edit the CSV draft, you can still explicitly export the
previous analysis and notes. This is not autosave; confirm downloads were saved.
Synthetic examples and user-supplied readings are distinguished;
imports do not establish calibration or successful hardware assembly.

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
require cloud credentials. This repository is published as an open-source portfolio
prototype; it is not a packaged product release or evidence of physical validation.

## Contributing

Issues and pull requests are welcome. Keep changes focused, preserve the local-only
boundary for project files and agent operations, and document any physical claims
with their evidence and limitations. Install dependencies with `pnpm install`, then
run the existing checks relevant to your change:

```sh
pnpm typecheck
pnpm test
pnpm build
```

For browser-facing route or interaction changes, also run the acceptance flow in
[Browser checks](#browser-checks) with `pnpm test:e2e`.

## License and third-party notices

The original project source is available under the [MIT License](LICENSE). Direct
dependencies keep their own licenses and notices; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the installed inventory and
important boundaries around manufacturer references, separately installed
CircuitPython drivers, and user-imported material.

## Browser checks

Start Studio on the test port in one terminal (`PORT=3100 pnpm dev`), then run
`pnpm test:e2e` in another. Install the matching browser once with
`pnpm exec playwright install chromium`. These local acceptance tests create QA
projects and catalog items in the running workshop; use a separate
`METATRANSFORMER_HOME` for disposable test data. The native-artifact test must use
the same `METATRANSFORMER_HOME` as the server.
