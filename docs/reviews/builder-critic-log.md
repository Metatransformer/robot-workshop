# Independent builder-workshop critique log

## Round 1 — before academy expansion, 2026-10-18

Reviewer: independent builder_harsh_critic subagent; read-only source and screenshot
inspection. Verdict: useful repository browser, not yet a system that teaches
independent building. Forty-eight articles alone would multiply that weakness.

Top findings accepted:
1. No demonstrable progression: distinguish read/practiced/physically demonstrated;
   include worked example, independent check, explanation and transfer task.
2. Weak theory-to-build connection: required/optional prerequisite paths and actual
   design decisions; existing servo/cyberdeck worksheets are not completed tutorials.
3. Slider motion can imply false confidence: explicit equations, assumptions,
   limitations, wrong configurations, repeatable saved results. GPIO != MCU emulation.
4. Learning is cramped by two trees and empty agent panel: build a focused /learn
   experience, intent search, richer glossary and exportable durable progress.
5. JSON source bundles are not compelling sharing: recipient-readable build packet,
   clear evidence, safe selection and inspected print/PDF output are required.

Hidden engineering practice to teach: measurement uncertainty, datasheets, fault
isolation, tolerances, assembly/serviceability, brownouts, grounding/noise, timing,
friction/backlash/saturation, and keeping firmware/design/test evidence connected.

Acceptance challenge: newcomer makes one meaningful project modification, explains
choices, calculates a limit, diagnoses a planted fault, records evidence, and gives
someone else a usable build packet. No completeness claim based on counts alone.

## Root numerical review of the 48 worked examples

Read every worked problem, calculation and result. Corrected the BJT resistor example: 430 Ω supplied less than the stated 6 mA required by forced gain 10; 390 Ω supplies about 6.4 mA, still subject to verified GPIO/transistor limits. Clarified pooled distance/time versus arithmetic mean trial speed, and the fastener example's single friction interface. This checks examples, not physical qualification of any design.

## Review queue for the completed implementation

- Check imported progress cannot claim bench demonstration without the required observation note; restoration should not silently discard newer evidence.
- Run a newcomer journey: sensor path → voltage lesson → quiz → bench note → glossary → lab → supplier → printable packet. Check browser reload and mobile width.
- Inspect an actual PDF's extracted text and rendered page, not merely print CSS.
- Verify object studies are explanatory analogues, not advertised appliance construction manuals, and all supplier identities remain visible beside purchase links.
- Next expansion should deepen at least one real build (servo barrier or display) with exact wiring, firmware, measured acceptance criteria, and complete consumables/tools. Do not mistake six object-study pages for six validated tutorials.
- The 48 modules establish breadth; missing applied depth includes thermal design, fluid flow/pressure, electromagnetic compatibility, sensors/metrology beyond the current examples, and fabrication-specific tolerancing. Expand through representative projects rather than claiming a complete degree curriculum.

## Round 2 — applied-learning alpha review

Independent critic verdict: conditional pass for a learning alpha; not yet a dependable novice path for every project. Accepted findings and repairs:
- Removed accidental chains through unrelated advanced material. Essential prerequisites now form ordered project-path closures; removed prerequisites remain optional related study. Path completion returns the learner to building rather than mislabelling unrelated modules as required.
- Fixed progress restoration/merge so valid bench evidence cannot be replaced by a newer short draft that fails validation on reload. Fixed glossary deep-link searches incorrectly reporting missing terms.
- Object candidate parts are explicitly incomplete, with visible variant requirements and project-starter links. Supplier identities distinguish TowerPro's SG92R from its seller Adafruit.
- Motor-driver lab now requires a documented input bias or deliberately imposed known logic state; no claim that a floating input is defined by a truth table.
- Project reports preserve firmware literally and visibly state that diagrams/images and relative links require the accompanying source project.

A narrower simulation review found saved notes could become associated with default rather than original run parameters, edited inputs could disagree with visible results, a default motor rating combination violated energy conservation, and a subsampled GPIO graph could alias fast switching. A separate closed-scope repair package addresses run provenance, dirty-state export gating, consistent defaults and transition-aware traces. These models remain illustrative rather than hardware validation.

Root verification so far: 118 unit tests and typecheck passed before the simulation repair; academy browser journey, progress backup/restore, blocked storage, mobile width, PDF generation/text extraction passed. Rendered the voltage lesson PDF's first page and inspected typography, equations and page boundaries. Full final gates follow the remaining repair.

Next product priority remains one complete physical build: exact variant BOM including cables/headers/consumables, wiring, executable firmware, acceptance tests, troubleshooting, and recorded real measurements. Existing sensor starter is the strongest foundation; servo/display/object studies still require more build detail. No quantity of articles replaces this evidence.

## Checkpoint verification — 2026-10-18

Final root gates: 122 tests across 18 files passed; typecheck and production build passed. All 11 browser cases passed (10 in the final suite, the fast-GPIO case on focused rerun after fixing a test-only case-sensitive field selector). This includes real supplier links → sensor starter, preserved original workshop flows, selected-file sensor PDF with literal firmware, learning restoration/mobile/blocked storage, simulation run restoration, dirty export prevention, consistent motor preview, power calculation and dense GPIO trace handling. Rendered and visually inspected the actual lesson and sensor packet PDFs. The first browser launch was sandbox-blocked; the authorized unsandboxed run completed normally.

All worker changes stayed within the aggregate planned file inventory; root integration preserves original workshop actions. This is a local checkpoint, not a public release or a physically validated build. Next work should prioritize a complete purchasing/assembly handoff for the sensor project and then one integrated servo/display example.

## Round 3 — sensor procurement supplement

Independent builder_harsh_critic reviewed the actual guide source and primary
supplier/assembly documentation. Conditional pass: parts and four-wire route are
coherent; package counts and soldering requirements are explicit. Reviewer found
(1) printed guide needs companion-file/source-bundle handoff because the web action
is hidden in print, and (2) wiring step needs direct pinout references. Root also
caught ambiguous '2x20' header wording and the unnecessary journey from purchase
rows to bottom-of-page links. These are accepted fixes before checkpoint.

Review limitation: the reviewer had no browser provider, so its review was source
and documentation only. Root independently ran the real browser journey through
object study → guide → PDF → new sensor project and confirmed BUY_AND_BUILD.md is
included. Final checks will follow the content repairs. No physical build occurred.

Round 3 completion: root corrected header count to two separate20-pin strips,
added inline product links and fallback selection criteria, added the companion
source-bundle handoff, and linked both exact pinout references at the wiring step
with VIN-versus-3Vo distinction. Reviewer then inspected rendered PDF pages1–2
and accepted this slice without a remaining blocker. Root checked actual browser
navigation,390px mobile width, PDF text and appearance, and new-project file
inclusion.125 tests across19 files, typecheck and production build passed.
Worker stayed within the three-file allowlist; root additive integration is listed
in the plan. No original seed firmware, wiring, catalog definitions or existing
project contents were changed. The guide is a supplement, not evidence of assembly.

## Round 4 — observed sensor data, not just predicted behavior

Root investigated the proposed servo follow-up first. Reviewed SG92R supplier
material did not resolve current demand or logic thresholds; the generic Pico
servo guide uses another model. That gate remains open. This cycle instead closes
a useful gap in the better documented sensor starter: bringing serial output back
into the workshop as user-supplied observations, with faults and resets preserved.

Independent builder_harsh_critic reviewed the closed package and parser during
implementation. It accepted the separation of synthetic/unverified origin,
per-segment notes and stale-export gating as the right contract. It confirmed a
numeric overflow case in the initial parser's mean; final implementation review
and browser evidence are pending below. This review is not hardware validation.

Round 4 completed: the independent reviewer accepted the final source and actual
desktop/mobile screenshots. Accepted repairs: scale plot calculations before
subtracting extreme inputs and label the actual plotted extrema; avoid the cited
finite-input mean overflow; disable redundant Analyze so it cannot erase notes;
invalidate pending file reads when the source changes; show analyzed provenance
separately from draft provenance; call results parsed readings, not validated
observations. Root enlarged mobile plot labels and made selected-segment export
scope explicit. Limits and replacement behavior are visible before importing.

Root reproduced 136 unit tests across20 files, typecheck and production build.
The two observation browser cases passed: source lines and summary in downloaded
JSON, separate segment notes, stale export gating, synthetic origin, file upload,
invalid header,390px width, and a deliberately delayed File.text() completion
that cannot overwrite newer analysis/notes. The existing procurement browser case
also passed with PDF extraction and new-project guide inclusion. Initial browser
failures were test selectors: nested label contents include form values, so checks
now use accessible textbox/combobox roles. Final screenshots were visually reviewed.

Worker64823 finished; root audited its four-file allowlist and reproduced checks.
Root's additive route/navigation/guide integration preserves original actions and
existing source projects. No purchase, live serial connection, flashing, external
publication or hardware validation occurred. This slice supplies portable selected
segment JSON/CSV reports; it does not yet restore reports into the notebook.


## Round 5 — an exact unloaded servo bench

Delivered a separate Pico + FEETECH FS90 starter, preserving the original SG92R
concept and existing user projects. Selection research records the seller's
explicit 3.3 V signal support and conflicting current figures without claiming a
guaranteed current limit. The guide includes supplier candidates, wiring nets,
connector preparation, required tools, staged checks, firmware handoff and an
empty bench log. No hardware measurements were invented.

Independent builder_harsh_critic reviewed the actual firmware and guide. Repairs:
throttle serial telemetry; remove printing before PWM shutdown; make the external
negative junction and separate Pico reference lead explicit; require a multimeter;
provide a concrete servo connector reference; identify both firmware files. Root
also corrected the button dimensions and linked project documents. Reviewer
accepted the final source and rendered PDF topology and handoff without a remaining
material blocker. Acceptance covers an unloaded prototype's documentation and
tested software, not a completed physical build.

Root found that newly introduced template parts were missing from older catalog
files. Sol29902 added missing BOM snapshots only during explicit project creation,
with a regression preserving customized inventory, old manifests and duplicate-free
repeat creation. Root refreshed only the Studio library afterward, preserving the
selected project and drafts. Browser acceptance simulates an initial catalog with
FS90 absent and verifies it appears after creation without reloading.

Root reproduced 146 tests across22 files, typecheck and production build. The
servo browser journey passed with PDF text extraction, desktop/mobile screenshots,
390px width, starter creation, both firmware files, buying guide, learning path and
catalog refresh. Exported Python is exercised via CPython and fake hardware for
startup/release/rearm/timeout, telemetry and partial-initialization cleanup; this
is not CircuitPython-on-board validation. A first browser mock used the wrong API
envelope and failed; the corrected envelope passed. One earlier unconstrained
unit run hit an I/O timeout; the complete two-worker run passed without weakening
that test. All three Sol packages finished and root audited the actual allowlists
and integration hunks. No purchase, flashing or external publication occurred.

Next: restore exported sensor observation reports into the notebook, retaining
provenance and notes without silently replacing unsaved work. Keep physical servo
validation explicitly pending; do not expand curriculum breadth to hide that gap.

## Round 6 — reopen observation reports without losing evidence

Implemented version 1 selected-segment JSON restoration with a local preview,
explicit replace/cancel, and cancelable file reads. Original segment index/count,
source lines, notes, recorded origin/source/import time and all capture issues
survive re-export. Derived summaries are recomputed. Only the exported segment
returns; raw CSV and absent segments are never reconstructed as original evidence.

Independent critic caught a compatibility gap in proposed string limits. Root
removed the arbitrary 8 MiB notes and 100,000 issue limits, retaining the advertised
16 MiB total JSON limit. A long-note/long-diagnostic roundtrip passes. Larger
reports remain downloadable, with an explicit cannot-restore notice and visible
limit. Nothing is silently truncated. Critic accepted final source and actual
rendered desktop/mobile screenshots; root clarified the top origin badge as
CSV draft to distinguish it from a restored synthetic dataset's recorded origin.

Root reproduced 160 tests across23 files, typecheck and production build. Five
browser cases passed: prior capture/stale/provenance journey, delayed CSV read,
export/reload/restore/re-export preserving exact evidence, canceled/unsupported
restoration preserving current work, and cancellation of a pending report read.
The first browser run failed an ambiguous alert selector because Next also owns
an alert; the selector now targets the report error specifically. No assertion was
weakened. Root audited the four-file worker allowlist and actual source/CSS hunks.
Sol7385 finished; root added browser coverage, compatibility repair and docs.

Next concrete gap: users' handwritten bench observations disappear if they close
or reload the tab before exporting. Add an honest unsaved-work warning for edited
observation notes, with export-aware behavior and tests, before adding automatic
storage. Keep the current browser-local privacy contract and portable reports.

## Round 7 — protect notes and provide a real recovery path

Edited notes now have per-segment export baselines. Restored notes begin clean;
deleting or changing them is tracked. JSON report handoff marks only the exact
exported segment's note text; readings CSV and issues exports do not. Existing
brand/Workshop/build-guide/theory destinations are preserved, with Next onNavigate
confirmation only for same-tab SPA navigation. beforeunload is attached only for
changed notes. Visible wording distinguishes browser download handoff from saved
files and acknowledges browser Back/suppressed-warning limitations; no autosave.

Malformed CSV now preserves prior readings and notes. Valid replacement validates
first, then asks before discarding changes using current refs, including notes
typed during file reading. Root cleared obsolete JSON restoration previews when
CSV selection invalidates their read token. Explicit report restoration retains
its existing review/replace flow rather than adding another prompt.

Independent critic reviewed source and actual screenshot, then found a recovery
trap: editing CSV and canceling replacement left prior notes intact but downloads
locked by stale state. Root added 'Export previous analysis and notes', explicitly
excluding the CSV draft and exporting only the selected prior segment. Browser
assertions verify old samples, current notes and original evidence, without
committing the draft. Critic accepted the repair; stale-banner wording also fixed.

Root reproduced165 tests across24 files, typecheck, production build and nine
sensor browser journeys. Coverage includes per-segment baselines, CSV export not
clearing notes, deletion/reversion, canceled link/replacement, malformed CSV,
notes edited during delayed import, real reload cancellation, failed download,
restoration and old capture flows. Initial reload test waited indefinitely on a
canceled navigation; bounded the navigation wait without changing assertions.
Worker independently started root-owned browser checks, colliding with artifacts;
root stopped worker11545 and reran one authoritative suite successfully. No worker
file-allowlist overrun was found. Root audited the helper/component/test hunks.
No purchases, external publication, flashing or physical-validation claims.

Next: the critic recommends an FS90 command explorer tied to the existing firmware:
button/state/pulse timelines and20ms PWM frames, not simulated shaft motion. This
moves learning toward understanding an actual starter instead of further notebook
polish. Differential tests against the exported Python controller are the gate.

## Round 8 — predict the starter's servo command

Added /labs/servo with four prediction/feedback exercises, sampled controller trace,
step controls, exact numeric values, event table and one ideal20ms PWM frame. Linked
from the existing FS90 guide, PWM lesson and labs navigation; original destinations
remain. Python firmware is unchanged. The TypeScript model matches original
controller states and pulses at every preset sample, with further boundary,
fractional-rounding, nonfinite/backwards/repeated-clock comparisons to actual
exported Python. Ideal duty percentage remains separate from hardware quantization,
loop jitter and physical servo behavior. No angle/torque/load/power model is claimed.

Independent critic requested that rejected button changes appear even when state
doesn't change, and that trace changes be held steps rather than diagonal ramps.
The implementation has both. Root trimmed the initial event table's per-pulse rows
to button/state transitions, preserving the important1.02s failed re-press. Root
also enlarged mobile axis labels, fixed long labels overflowing chart margins,
and corrected the pulse-measurement tool wording to logic analyzer/oscilloscope.
Actual desktop/mobile screenshots reviewed; final independent visual verdict below.

Root reproduced168 tests across25 files, typecheck and production build. Both servo
browser journeys passed: existing printed-guide/starter/catalog path plus all four
predictions, incorrect-answer feedback, exact1500us/7.50% selected values, compact
events including failed repress, step endpoints,390px width, and lesson discoverability.
The first combined browser run exposed an existing starter mock intercepting later
bootstrap requests after teardown; limited it to the single initial request it was
intended to modify and reran both journeys successfully. No product assertion was
weakened. Both Sol packages finished within their closed two-file allowlists; root
reviewed their files and additive integration. No purchases, flashing, publication
or hardware measurements occurred.

Final independent visual verdict: accepted, no material teaching/correctness blocker.
Next bounded suggestion: Pico/BME280 wiring inspection practice, using the exact
existing board endpoints and an explicit netlist. Teach physical pin versus GPIO
name, SDA/SCL swap, missing common ground and an incorrect supply endpoint with
unpowered checks. It must not claim electrical simulation or approval of arbitrary
wiring; verify exact variants before authoring the fault explanations.


## Round 9 — inspect the sensor wiring before power

Added /labs/sensor-wiring: four neutral connection cases for the original Pico
and Adafruit BME280 starter, physical pin/GPIO labels, accessible connection table,
separate diagnosis and unpowered-check feedback, and a breadboard strip exercise.
Official Pico and Adafruit pinouts were reread; sources are linked in the lesson.
Existing guide, starter, lesson and lab destinations remain; links are additive.
No electrical solver, powered fault testing or hardware approval is claimed.

Independent critic identified that tracing all four paths is valid for every fault;
root accepted that answer alongside the targeted check. Root isolated all new CSS
classes to avoid collisions with the existing sensor notebook, clarified horizontal
scrolling on mobile, and added exact physical-pin assertions. A mechanical prefix
edit briefly broke the model import; typecheck/build caught it and it was repaired.
The fresh browser inspection then exposed an SVG title hydration mismatch: a
multi-child title was replaced with one string. The final E2E now reloads the route
and asserts no page errors; it passed after the repair.

Root reproduced 174 tests across 26 files, typecheck, production build and three
sensor browser journeys covering existing notebook flows and the new wiring lesson.
The final wiring rerun passed all four cases, broad checks, rejected powered testing,
breadboard feedback, mobile overflow and lesson discoverability. Independent actual
source and desktop/mobile review accepted with no material blocker; small mobile
body type remains presentation debt. Worker stayed within its four-file allowlist;
root reviewed implementation and additive integration. No purchases, publication,
flashing or physical measurements occurred.

Next bounded package: a separate sensor-project LED indicator variant. Research an
exact documented LED/resistor and Pico output constraints; connect nominal-current
calculation, GPIO wiring and threshold firmware, with a deliberate startup test.
Distinguish commanded GPIO state from observed illumination. Preserve existing
sensor template and observation format. No automatic hardware-validation claims.


## Round 10 — turn a sensor reading into an external indicator

Added a separate sensor-led starter, source packet, printable guide, real catalog
parts and learning path. Original sensor/servo/linkage definitions and links remain
intact. New catalog entries represent one LED, one resistor and one six-wire set;
supplier package quantities remain distinct. Manufacturer sources and calculation
assumptions are recorded in docs/research/sensor-led.md. Existing CSV/report format
is unchanged: led records a command, not an optical observation.

Three closed Sol packages produced firmware/execution tests, the build packet, and
additive template/catalog/learning integration. Root reviewed all hunks and files;
workers did not stage, commit, browse or build. Root fixed the four-versus-six-wire
BOM mismatch, replaced inaccurate source quote text with verified wording, corrected
clear LED297 identity and the missing adafruit_register dependency, and used the
actual voltage-current-resistance lesson ID. Independent critic requested explicit
ambient-relative thresholds and restart-versus-retention wording, now in the guide.
Imports precede startup pulses, so troubleshooting now asks for the serial traceback.

The first browser journey found missing TEMPLATE_LINKS registration; root repaired
it instead of bypassing the guide. Final browser checks pass for PDF text, new starter
creation, source export containing both Python files and GP2 output, catalog handoff,
learning path, original sensor guide and existing tutorial/glossary navigation.
The existing broad Pico/BME280 test selector was narrowed to the original starter's
full title so the added variant cannot make it ambiguous.

Root reproduced182 unit tests across28 files, typecheck, production build and the
three distinct browser journeys above. Exported Python is executed with mocked
CircuitPython modules, covering startup order, thresholds, finite fields, address
faults, read faults, recovery and compatibility with the existing CSV parser.
Actual desktop/mobile review accepted; a suspected clipped heading was checked in
a fresh390px viewport (clientHeight=scrollHeight95px, no clamp, all text visible),
so no speculative CSS change was made. No hardware was wired, flashed or measured.

Next concrete package: a bounded temperature hysteresis explorer tied to indicator.py.
Show temperature, prior state and next commanded state; compare a single threshold,
include fault/reset and explain startup/restoration separately. Differential-test
against the actual exported Python. No thermal, optical or brightness simulation.


## Round 11 — explain retained state through exact firmware decisions

Added /labs/hysteresis with three prediction/retry sequences, a step navigator,
previous/new command values and full comparison table. Memory and chatter cases
show where a single28°C threshold differs; fault and post-startup restart clear the
remembered command. Existing firmware is unchanged. Sample decisions are compared
against actual exported indicator.py across presets, exact/near boundaries and
1024 deterministic temperatures. Fault/reset transitions are explicit harness rules,
not claimed full firmware emulation. Startup pulses and physical behavior excluded.

Independent critic required explicit 'previous hysteresis command' labeling and
separation of imposed comparator clearing from Python sample checks. Root applied
those, clarified comparison headings and made every question ask the command at a
numbered step. The first attempted handoff-copy replacement silently missed the
worker's final wording; independent review caught the remaining indicator.py edit
instruction. Root used an asserted exact replacement to direct HIGH_C/LOW_C edits
to code.py and added a browser assertion for that instruction. Final rerun passed.

Both Sol packages stayed within their two-file allowlists. Root audited all hunks
and additive guide/lesson/labs links, preserving existing destinations. Worker ran
the default parallel suite beyond requested focused checks and saw an unrelated
project-format timeout; its serialized suite passed. Root independently reproduced
186 tests across29 files with maxWorkers2, typecheck and production build. Browser
checks cover all predictions, incorrect feedback, retries, table values, step bounds,
390px width, reload without page errors, lesson links and the existing LED guide /
PDF / project / bundle / catalog journey. Desktop/mobile critic accepted layout;
final handoff correction and refreshed evidence resolve its only source blocker.
No measurements, hardware flashing, purchases or external publication occurred.

Next bounded package: an LED resistor measurement worksheet. Name exact probe nodes,
accept observed resistor resistance and voltage, derive current/power with units,
and preserve user-entered evidence separately from nominal estimates in a printable
record. No automatic assertion that entered values were measured or circuit validated.
