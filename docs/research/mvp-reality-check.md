# MVP reality check: can Nick actually build things with it?

Date: 2026-10-17. Status: critical product/feasibility review, not a completed
formal engineering/design review or an implementation test.

Reviewed: [MVP execution plan](../plans/metatransformer-mvp.md),
[tutorial curriculum](../plans/tutorial-library.md), and
[13 real build examples](real-world-build-examples.md). Includes an independent
read-only reviewer assessment. No application or hardware has been built here.

## Verdict

The architecture is plausible, but the current MVP gates could all pass without
Nick completing a working physical invention. Files, ACP, previews and a catalog
are enabling infrastructure, not proof of a useful engineering workflow.

Proceed with a tightly bounded builder pilot before implementing the full breadth.
Keep public sharing/list/spatial discovery in the full MVP, but use a real build
to establish what the environment needs. Do not promise arbitrary device design,
automatic component compatibility or reliable physical behavior from generated
geometry. One successful build proves one supported path, not universal capability.

## Findings

| Priority | Gap that could strand a builder | Required proof / proposed remedy |
| --- | --- | --- |
| P1 | Local acceptance ends at artifact edit/export | Assemble and run one selected project, make a meaningful change, rebuild/retest, retain observed evidence |
| P1 | Native files are preserved but toolchain handoff is vague | Exercise exact install/build/export/manual deployment instructions for one board, toolchain and desktop setup |
| P1 | Inventory presence does not prove compatibility | Pin a known parts combination; label substitutions as verified, needing checks, or unsupported, with specific constraints |
| P1 | Agent sees intended source but not necessarily actual hardware | Tie photos/logs/measurements to assembled configuration and flashed firmware revision; include one diagnosed failed test |
| P1 | Concurrent external changes can be overwritten by candidate adoption | Prove preservation and interruption recovery before using integrated adoption on valuable work |
| P2 | Studio's advantage over an agent plus repository is unproven | Compare the same modification task; Studio must make current files/results, parts/tools and errors easier to understand |
| P2 | Too many demonstrations can hide one weak workflow | Complete one end-to-end tutorial before broadening live adapters and physical project classes |

These are recommendations to resolve in the review, not silent scope cuts or
claims that the proposed remedies have passed tests. Public artifact active-content
isolation remains a separate known engineering issue for the hosted release.

## First useful vertical slice

1. Nick selects a first physical project and records available parts/tools.
2. Create it in a plain repository with the user's coding agent; no Studio/cloud
   setup should be needed to obtain useful instructions and source.
3. Pin a board/hardware revision and toolchain. Produce BOM, tools list, wiring or
   assembly drawings, source and expected observations. Check missing equipment.
4. Exercise compilation/generation through actual installed tools. Preserve raw
   diagnostics so the agent can fix concrete errors rather than guess.
5. Nick assembles and deliberately deploys using the tested tool/manual steps.
   Excluding automatic hardware control does not exclude clear flashing and
   deployment instructions. The application need not invent its own flasher.
6. Capture a real photo, log or measurement with configuration and revision context.
   The agent must be able to consume appropriate supported image/text artifacts;
   storing an image without providing it as context is not a troubleshooting loop.
7. Make one meaningful change, deploy/test again and reconcile intended versus
   observed behavior. Record at least one failure and correction when encountered.
8. Open the same project in thin Studio. Inspect source, preview/freshness, required
   versus owned parts/tools, candidate changes and observations. Export it portably.
9. After local proof, publish it and a documents-only project; verify anonymous
   understanding and remix through both list and spatial discovery.

Ordinary Markdown, images and log files can supply the physical feedback loop.
No resumable checkpoint UI, device telemetry platform or generalized compatibility
solver is implied. Manual records are acceptable if they are accurate and usable.

## What must be built versus reused

Build: portable project/part/tool contracts, useful local catalog and references,
scaffold/validation CLI, artifact/derivation tracking, safe local integration,
ACP conversation UX, previews, candidate review, and eventually publication/discovery.

Reuse: existing coding agents, Git, native CAD/EDA tools, compilers/flash tools,
standard formats, hardware modules and documented starter circuits. Metatransformer
should coordinate this environment and retain context, not implement every tool.

Physically verify: exact board/power/interface/connector combinations, fabrication
fit, firmware on the selected device, movement where applicable, and observed
performance. AI workers can prepare artifacts and interpret evidence, but cannot
substitute for access to the actual hardware or an observed test.

## Candidate first builds, grounded in research

**Small sensor-to-light device:** the Adafruit Metro Glance Thermometer has wiring
and a complete sketch, no runtime model service, and a clear modification/test
loop. It is an older complete foundation, not a claim about a new AI build. Porting
to another board requires revisiting ADC/voltage assumptions. Its low integration
burden makes it a useful baseline if Nick wants electronics fundamentals.
[Source](https://learn.adafruit.com/experimenters-guide-for-metro/circ18-make%20it%20better).

**Custom cyberdeck:** more directly matches Nick's expressed interest. A working
small computer with chosen display/input, a customized mount/enclosure and a
complete assembly guide is a realistic first project class. Add local inference
as a separate tested branch. The Adafruit Pi 400 plate has native/exchange/fabrication
assets, while its Pi LLM guide is a separate 2025 recipe; combining them is our
proposed adaptation, not an already validated build. Exact hardware is not selected.
[Plate](https://learn.adafruit.com/cyberdeck-plate?view=all),
[local Pi LLMs](https://learn.adafruit.com/local-llms-on-raspberry-pi?view=all).

**Talking desk robot:** compelling but combines audio, model/backend, electronics,
mechanics and control. Begin with known hardware and bounded movement; add voice
only after it works. Stack-chan and XiaoZhi provide concrete source precedents,
but different board/firmware/backend variants are not automatically interchangeable.
[Stack-chan](https://github.com/stack-chan/stack-chan),
[XiaoZhi](https://github.com/78/xiaozhi-esp32).

Do not choose the easiest demo if Nick has no interest in building it. The first
project must be motivating enough to finish and narrow enough to debug. Hardware
and preferred first build were requested from Nick; answer still pending at this
review's creation. No parts purchases or sourcing commitments have been made.

## Effort and uncertainty

Independent review gave these rough planning bands for one experienced lead,
bounded AI workers and one desktop environment: 1–3 focused weeks for the first
repository-first physical proof, another 4–8 weeks for a useful integrated local
alpha, and roughly 3–6 months total for the full current public MVP. These are
judgment estimates, not measured throughput or commitments; physical procurement
and iteration can dominate elapsed time. A simpler already-documented build may
be usable sooner, while new robot mechanics can take substantially longer.

Root's planning conclusion: budget weeks for a useful pilot and months for the
whole current scope; do not imply a weekend demo establishes production readiness.
Re-estimate after a short feasibility milestone exercising ACP, external-file
adoption and the first selected native toolchain. More agent workers help only
after interfaces are stable; integration and physical testing remain bottlenecks.

Concrete local evidence: Node, pnpm, npm, Git, Codex, Claude and Python executables
were found on PATH. Blender, FreeCAD/FreeCADCmd, KiCad CLI, Arduino CLI and OpenSCAD
were not on PATH. This does not prove GUI installations are absent. No tool was
installed or executed against hardware; select only the tools the first build
actually needs.

## Go / no-go

**Go for a useful pilot:** Nick completes a build from supplied artifacts, modifies
it, observes the intended change, and the project retains accurate source/evidence.
The catalog distinguishes requirements from owned parts/tools, and Studio makes
at least one recurring task easier than the standalone-agent baseline.

**No-go for a broad readiness claim:** only generated files, attractive scenes,
successful compilation or an agent's confidence are available. No fully reviewed
engineering/design plan or demonstrated physical proof exists yet.
