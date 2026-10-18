# Applied builder academy — implementation and critic loop

User authorized continued autonomous improvement through tomorrow, 2026-10-19.
Hourly heartbeat stops beginning new expansion after 09:00 America/Denver that day.
This is a substantial applied robotics curriculum, not a claim to replace every EE,
ME or CS degree topic or to certify engineering competence.

## Product outcomes

A builder can choose a project, identify needed theory, explain design choices,
calculate a limit, try an experiment, diagnose a fault, record observations, and
share an intelligible build packet. Lesson count alone is not an acceptance gate.
Preserve the existing Studio, filesystem/agent workflows, parts and source bundles.

## Architecture

Static typed curriculum under src/lib/curriculum; no cloud dependencies or database
changes. Six tracks, 48 first-pass modules, explicit acyclic prerequisite graph.
A separate /learn surface gives reading full space and links back to the workshop.
Per-browser progress separates read, practiced, physically demonstrated; exportable
JSON records are user evidence, never credentials. Lessons remain accessible without
completing prerequisites. Search should include everyday troubleshooting/build intent.
Advanced glossary: plain and technical explanations, units/formulas, examples,
misconceptions, and lesson backlinks. Project recipes expose required vs optional
learning modules. Browser Print/Save PDF creates clean lesson/project packets; actual
output must be inspected. Portable source export remains complementary.

## Module contract

src/lib/curriculum/types.ts is root-owned. Each module has a concrete capability,
prerequisites, substantive original teaching, worked numerical/reasoning example
with sanity check, independent question and explained answer, experiment with expected
observations, transfer task, exact limits/cautions, source links and build relevance.
No copied textbooks, empty headings, fabricated hardware results, or stock generic
labs. Walk through units, assumptions, failure cases and diagnosis in ordinary language.

## Canonical module IDs (global prerequisite vocabulary)

- foundations: units-estimation, algebra-trig, vectors-frames, rates-integration,
  probability-uncertainty, measurement-instruments, experimental-method, engineering-workflow
- electronics: voltage-current-resistance, circuits-kirchhoff, capacitance-transients,
  diodes-transistors, power-regulation, batteries-protection, digital-interfaces, motor-drivers
- mechanics: forces-free-body, torque-gearing, materials-stress, fasteners-bearings,
  tolerances-fits, cad-fabrication, mechanisms-kinematics, friction-efficiency
- embedded: programming-state, data-structures, mcu-gpio, timers-pwm, adc-sampling,
  interrupts-scheduling, communications-protocols, firmware-debugging
- control: signals-systems, feedback-pid, stability-tuning, filtering-estimation,
  system-identification, trajectories-motion, sensor-fusion, control-discretization
- robotics: robot-architecture, kinematic-chains, localization-odometry, perception-basics,
  planning-navigation, system-integration, reliability-faults, documentation-sharing

## Work packages / current ownership

Root owns types.ts, this plan, critic log, integration, final audit and gates.
A: src/lib/curriculum/foundations-electronics.ts (16 modules).
B: src/lib/curriculum/mechanics-control.ts (16 modules).
C: src/lib/curriculum/embedded-robotics.ts (16 modules).
Each CLI Sol worker receives exact closed allowlist, no commits, no unrelated edits.
Next packages after content: advanced glossary + graph/index tests; focused academy
UI and progress; simulations + executable tests; print/export. Exact allowlists will
be recorded before dispatch. Do not launch overlapping owners on heartbeat resumption.

## Simulation fidelity

Start with analytical low-voltage labs: ideal RC step, linear DC motor torque-speed
and gearbox/power calculation, source/load power budget, explicit GPIO state-machine
behavior. Expose units, parameters, assumptions, omitted effects and faults. Save
parameterized results as a report; never label a behavioral model as MCU emulation.
Research verified AVR8js as a later AVR/HEX emulator, with hardware models still
required; Pico/rp2040js does not guarantee writable flash/filesystem compatibility.
No arbitrary circuit solver, arbitrary MCU support, electrical safety certification,
hardware flashing or generated firmware execution is implied by this first slice.

## Critic acceptance cycle

1. Deliver one coherent slice, run its checks and inspect actual UI/export.
2. Independent critic reviews learner capability, usability, content correctness,
   connection to real projects and misleading claims. Record severity and evidence.
3. Repair top findings, rerun affected gates, checkpoint and list remaining gaps.
4. Next cycle closes substantive gaps, not cosmetic churn or article-count padding.

## Remaining breadth to evaluate after first slice

Deeper analog/AC circuits, op-amps, EMC/ESD, PCB design, thermal engineering, embedded
C/memory/RTOS, ROS2, inverse kinematics/dynamics, computer vision, real firmware
emulation, more fully buildable integrated projects, accessibility, actual exported
PDF quality, shareable static build pages. Choose next work by critic evidence.

## Accepted steering: everyday objects and real purchasing

User reframes outcome as learning how things work and reverse engineering everyday
objects: vacuum cleaners, televisions/displays and cars, then building approachable
versions. Add an object explorer with parts/subsystems, energy and information flow,
interfaces, linked theory, observable experiments, and a safe low-voltage build
analogue. Do not imply a bench-scale model is an equivalent household appliance or
roadworthy vehicle. Distinguish decomposition from a build-ready design.

Real purchasing remains part of the workshop: preserve exact manufacturer/model
identity, source documentation and quantities; expose verified official supplier
links, compatibility/unknowns and user-owned inventory. No invented price/stock,
automatic purchase, or affiliate tracking. Checkout stays with the real supplier.

## Continuation checkpoint — 2026-10-18

Implemented: 48 modules, 254 glossary entries, ordered prerequisite paths, quizzes,
bench evidence/progress backup, six everyday-object studies, exact supplier links,
four bounded simulation labs and selected-file printable build packets. Content,
UI, glossary, object/supplier, print and path workers are complete. Root reviewed
worked calculations, integrated routes/Studio, and repaired critic findings. The
simulation review package is complete, including run provenance and trace correctness. No implementation workers remain active.

Validation: root production build/typecheck and 122 unit tests passed; eight
existing/academy browser checks, a selected sensor PDF check and a simulation
notebook restore/dirty-export check passed. Consult the critic log for final counts
and remaining limitations rather than treating content breadth as curriculum completeness. Final browser coverage is 11 passing cases, including fast GPIO trace handling; see the log for the focused selector-fix rerun.

Next cycle: deepen the real Pico/BME280 build procurement and assembly handoff,
including exact purchasable headers/cables/connectors and tools, clear variants and
inventory gaps. Then complete one servo or display build with exact firmware,
wiring and acceptance criteria. Preserve learning-to-building-to-purchasing links.
No physical measurements have been taken. Do not claim validated hardware,
complete appliance instructions, stock/prices, or integrated checkout.

Hourly continuation is scheduled through 2026-10-19 09:00 America/Denver. Follow
the independent critique loop and record substantive fixes here and in the review
log. All earlier worker session IDs in work-package artifacts are historical;
check actual completion before assuming any is active.

### Behavior preservation inventory for this change

Before: workshop and template exploration; project files, engineering plans, result-copy editing; real catalog quantities and ingestion; agent permissions/run/adoption; source bundle selection/export and CLI imports. After: preserve all of those destinations/actions, add separate Learn/Labs/How-it-works links, project learning path, supplier links and selected build packet. No navigation consolidation or removal. There is no cloud checkout or purchase execution; verified external supplier pages are the procurement MVP.

## Cycle 3 — sensor purchasing/assembly handoff (2026-10-18)

Purpose: turn generic accessory entries into a usable procurement decision and
unpowered assembly route. One canonical report/Markdown guide provides exact
candidate SKUs, units-used versus purchase-pack quantities, USB host choices,
header soldering prerequisites, breadboard connectivity, preflight and diagnosis.
Existing sensor projects link to the web guide without rewriting local files;
new projects receive BUY_AND_BUILD.md. Firmware and pin mapping stay unchanged.

Sol package: docs/work-packages/sensor-procurement.md, session80802,
/private/tmp/mt-sensor-procurement.log and -result.txt. Closed ownership:
src/lib/sensor-build-guide.ts, append-only sensor seed file/import, and focused
unit tests. Root owns route, two additive discovery links, browser acceptance,
source evidence and integration review. Independent builder_harsh_critic reviews
actual guide/UI. This active note will be superseded by completion evidence.

Before/after behavior inventory: preserve all project creation, files, catalog,
agent execution, learning, supplier links and print/source export. Only add a
sensor guide destination to Overview and the thermostat study, plus a new route
and portable file. No project/catalog migration, purchases or stock claims.

Cycle3 completed: worker80802 exited successfully; no implementation workers active.
Guide available at /build-guides/sensor. Independent reviewer accepted final PDF
and handoff.125unit tests, typecheck, build and focused browser/PDF/mobile/template
journey passed. Primary pinout references are included beside wiring steps.

Next concrete work package: complete the one-servo desk-creature starter as a
bench-scale barrier/indicator. First root must verify the exact servo voltage,
signal levels and supply topology from primary documentation; do not infer startup
or stall current from the torque rating. Choose a documented power source, define
common ground and USB/backfeed boundaries, require an unloaded initial test and
conservative travel limits. Then give Sol closed ownership of a new guide/firmware
module and focused tests, with append-only additions to the desk-robot seed.
Acceptance: exact BOM/accessories, wiring table, runnable firmware with bounded
motion and safe startup/fault behavior, a testable load/torque calculation,
troubleshooting and portable source/PDF handoff. Preserve the current concept
worksheet and mark all hardware observations pending. If primary documentation
cannot support the chosen configuration, record that gap instead of inventing it.
