# Metatransformer tutorial library

Status: curriculum proposal; real-build research completed. No hardware build or
tutorial implementation has been verified. Date: 2026-10-17.

## Purpose

Provide openable, editable invention projects that teach users how to build their
own increasingly complex things. The user explicitly compares this progression
to Unity tutorials: start with a complete small example, play with it, modify it,
then use the learned pieces in an original project. Custom cyberdecks and robots
with language-model interfaces are explicit interests.

Real-world projects supply evidence of useful patterns and achievable outcomes.
They are not automatically Metatransformer templates or redistributable content.
Credit original builders, distinguish project dates, and review software, hardware,
asset and documentation rights separately before adapting a project.

## Selection criteria

- Demonstrated build or maintained build guide, with source/BOM where available.
  A video announcement alone is inspiration, not a reproducible tutorial.
- A clear, interesting output that is understandable in an image or short clip.
- Consumer-accessible hardware, with exact dependencies and alternative sourcing
  stated honestly; no assumed stock, compatibility, price or delivery time.
- Each tutorial teaches one main new concept while reusing earlier concepts.
- The project has value as files and guidance, even without a simulation.
- The build's mechanical, electrical and software boundaries are explicit.
- AI's role is labelled: used to design/code, used at runtime, both, or unverified.
  Simple useful projects do not need a token-consuming AI feature to qualify.
- The example can be opened before buying hardware. Supplied outputs or recorded
  data are labelled as examples/replays, not a connection to an actual device.
- A user can make a meaningful change and identify how to check its effect.
- Practical failure modes are observable: wiring error, unsupported board, missing
  dependency, sensor range, network loss, or actuator travel limits as applicable.

## What makes a tutorial complete

Each selected tutorial is a normal portable project, usable from standalone
Codex/Claude Code or Studio. It includes:

1. An entry guide with intended result, prerequisites and a short demonstration.
2. A bill of materials, units/specifications, ordinary supplier references and
   optional own-part substitutions with their compatibility assumptions.
3. Wiring/assembly illustrations and editable native source where relevant.
4. Firmware/software source and reproducible toolchain/dependency instructions.
5. Build and test guidance with expected observations and troubleshooting notes.
   These are ordinary documents, not the previously deferred checkpoint UI.
6. A supplied preview/result so the project is understandable without hardware.
7. A small modification exercise and an explicit way to verify the change.
8. Known limits and a record distinguishing expected, calculated and observed
   behavior. A successful software test is not a claimed physical build.
9. Project metadata, sources/licenses and a presentation suitable for sharing.
10. A "Your workshop library" section identifying existing parts/tools to reuse,
    new definitions or equipment to catalog, and reusable designs/modules produced.
    Copying a template does not mean the user owns its listed hardware.

Not every tutorial needs CAD, a 3D scene, AI inference, or a simulator. A firmware
project can expose a recorded sensor stream for exploration; a mechanical project
can have a bounded motion model; a cyberdeck can mostly be assembly and integration.

## A workshop library that grows with the user

The library spans projects and is part of the core local product. Catalog part
definitions/specifications, separately record owned parts and quantities, and
catalog tools/equipment with useful capabilities and limitations. Names, tags,
notes, pictures, source documents and stable references make the collection
searchable and reusable. Custom or salvaged items need no supplier catalog match.
Catalog entries can be useful with a name, notes and a photo; they do not require
a 3D model. The same catalog must be accessible through ordinary lists/search,
regardless of how the workshop represents shelves or equipment visually.

For example, a first sensor build might introduce a development-board definition,
a sensor and a breadboard, while recording the user's multimeter and soldering
iron as tools. A later robot project can reuse those records and reveal the extra
parts/equipment it needs. Reusable CAD designs, firmware modules and fixtures can
also be retained as project artifacts with explicit references and provenance.

Distinguish project requirements from actual possession. A BOM lists components;
a tools list identifies equipment used during assembly/testing. Exported projects
carry the needed definitions/instructions without leaking a person's full private
inventory or depending on their local catalog. Opening a tutorial neither creates
owned stock nor decrements it, purchases anything, or claims a tool is compatible.
Advanced stock accounting, reservations, maintenance schedules and checkout are
not implied by this catalog requirement.

Each tutorial should make the progression visible: "already in your workshop,"
"needed for this build," and "reusable in your next project," using actual recorded
ownership rather than inferring ownership from earlier downloads.

## End-to-end experience

```text
Discover a result -> Open example -> Understand parts and behavior
  -> Change one parameter/behavior with agent -> Validate files/selected result
  -> Source parts yourself -> Follow build guide -> Record actual observations
  -> Share your variation with source attribution
```

Opening and modifying source requires no purchase, platform account or hidden
hosted agent. Hardware-only operations remain explicitly separate. A runtime AI
example must describe its provider/local-model dependencies independently from
the coding agent used to author the project.

## Proposed progression structure

| Stage | Main new concept | Evidence needed before selecting a tutorial |
| --- | --- | --- |
| First output | Change code, observe a light/display/sound | Small reproducible build, simple BOM and wiring |
| Sense and react | Read a sensor and act on a threshold/event | Units, recorded data and a physical test procedure |
| Add movement | Control a bounded servo or simple mechanism | Geometry/travel limits, power requirements, observable result |
| Build a personal device | Combine enclosure, display, input and software | Cyberdeck-style integration with assembly/source details |
| Add language or vision | Connect inference to a useful device behavior | Clear local/API dependency, latency/failure behavior and constrained outputs |
| Combine subsystems | Robot perception, actuation and interaction | Documented robot platform; bounded commands and reproducible setup |

Final project names/order depend on the research report. This progression is a
candidate library, not a requirement to implement six domain engines or fabricate
every advanced robot before MVP. Select a small first release of complete tutorials;
label later references and unverified prototypes explicitly.

## Relationship to architecture fixtures

The MVP's documents-only, mechanism, sensor-logger and quadruped cases test format
and runtime boundaries. They are not automatically polished user tutorials. A
fixture may become a tutorial only after it meets the artifact/build criteria
above. Conversely, a tutorial can rely on a native tool without making that tool
a mandatory installation for every Metatransformer user.

Research input: [real-world build examples](../research/real-world-build-examples.md).
Format input: [open-format landscape](../research/open-format-landscape.md).
Execution context: [MVP plan](metatransformer-mvp.md).

## Research-backed candidate progression

The [research report](../research/real-world-build-examples.md) covers 13 documented
projects and clearly separates newer AI examples from older useful fundamentals.
The following are proposed original/adapted tutorials, not completed templates:

| Candidate | Teaches | Reusable workshop additions |
| --- | --- | --- |
| Sensor-to-color light | Measurement, threshold, physical output | Board/sensor definitions, owned items, threshold firmware |
| Custom enclosure | Dimensions, fit and fabrication | Editable enclosure, material and printer/tool capability records |
| One-servo desk creature | Bounded motion and mechanism | Servo/bracket definitions, gesture source and assembly |
| Talking desk creature | Audio/backend/device boundary | Audio parts, voice recipe, bounded action module |
| Camera describer | Preserve input and inspect model output | Camera definition, image/prompt/result records |
| Personal AI cyberdeck | Packaging compute, display/input and model setup | Mount designs, board/display parts, toolchain and performance notes |
| Small rover | Calibration and recorded physical motion | Wheels/motors/chassis, control modules and calibration data |
| Reachy Mini behavior remix | Extend a known robot platform | Kit revision, behavior modules and compatible accessories |

These are branches rather than a compulsory eight-project course. Start with one
complete build selected against Nick's interests and equipment. Do not make voice
APIs, printing equipment or robotics prerequisites for every user. Dataset/model/
asset licensing and availability may make a reference unsuitable for bundling.

## Pending selection

- Source-backed project shortlist and the proposed first complete tutorials.
- Exact hardware variants, supported toolchains and sourcing assumptions.
- Which examples we physically validate, which use documented upstream evidence,
  and how those differences are shown to users.
- Rights to redistribute/adapt each source, image, model and guide.
