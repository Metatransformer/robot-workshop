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
