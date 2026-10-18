# Metatransformer — local prototype handoff

Delivered as a local-first workshop in /Users/nickbryant/robot-workshop. The autonomous
improvement loop is paused at the user's request to finish and deliver. No further
expansion is scheduled. This is a usable prototype, not a published or physically
validated engineering product.

## Start here

The current development instance uses http://127.0.0.1:3100.
To start it yourself: `PORT=3100 pnpm dev` from the repository (Node 22+, pnpm 10).
The default without PORT is 3000. Keep it local; this is not a hosted deployment.

1. Open /learn to browse 48 applied modules across six tracks, linked prerequisites,
   worked examples, exercises and a 254-term advanced glossary. Reading, practice
   and recorded bench demonstration are separate progress states.
2. Start with /build-guides/sensor for the original Pico + Adafruit BME280 project.
   Read the exact variant/header/cable requirements, inspect /labs/sensor-wiring,
   then create a new starter. The project files are ordinary editable source.
3. Move to /build-guides/sensor-led for the external LED/resistor variant. Practice
   its state rule at /labs/hysteresis; record resistor observations at /bench/led.
4. For movement, /build-guides/servo describes the unloaded FS90 bench;
   /labs/servo explains its actual controller commands and restart/rearm behavior.
5. Review selected files with Export source. Share the portable source bundle with
   the PDF guide, since PDFs omit images and deactivate project-relative links.

No hardware was purchased, wired, flashed or measured during development. Read the
staged checks and stop conditions before attempting a build. Record real outcomes
separately from the synthetic examples and software tests.

## What is usable

- Persistent local projects, editable engineering plans and firmware; native image
  and GLB previews, a tunable linkage, and documented invention starters.
- Parts/tools inventory with source provenance, local PDF/text specification
  ingestion and review before catalog save. Scanned PDFs need manual text; no OCR.
- Exact part candidates and supplier links for supported starters. Inventory,
  required quantities and supplier packs are distinct. No ordering takes place.
- Academy, linked glossary, everyday-object breakdowns, bounded RC/motor/power/GPIO
  labs, wiring inspection and firmware-specific servo/hysteresis lessons.
- LED measurement worksheet with local drafts, explicit probe locations, conditional
  current/power calculations, JSON records and printable observations.
- Sensor CSV analysis, separate recording segments, bench observations, downloadable
  and restorable observation reports, plus protection for edited notes.
- Printable learning/build reports and selected-file source bundles with CLI import.
- Local ACP integration with candidate project directories and permission UI.
  Projects remain usable without an agent. See agent-setup.md for adapter details.

## Practical limits

The curriculum is an initial authored library, not a complete EE/ME/CS education.
Plans and software models do not establish buildability, calibration, mechanical
fit, electrical margins or safety. The device examples are researched but unbuilt.
The analytic models are not a general circuit, rigid-body or microcontroller emulator.

The ACP transport is tested against a stdio test peer. A real authenticated model
session still needs an end-to-end smoke test; paid inference was not used for that
product-level check. Claude/OpenCode adapters remain optional setup, not verified
installations. Candidate directories are not an operating-system sandbox.

Hosted accounts/public project pages, social discovery/remixing, polished share
cards, affiliate purchasing/fulfillment, Electron packaging and a public release
are still future work. No open-source license file has been selected; resolve that
before publishing. No Supabase cloud credentials are needed by this local prototype.

## Evidence and maintenance

The final verification and checkpoint are recorded in reviews/builder-critic-log.md.
That log includes independent critique, fixes, browser/PDF checks and test limits.
Plans and work packages remain under docs/plans and docs/work-packages. Changes were
reviewed and committed locally; nothing was pushed or published.

Browser QA creates clearly labeled synthetic projects in the test workshop. Keep
those separate from actual bench evidence. User projects were not overwritten.
Before a first physical build, confirm received part identities, headers, cable,
resistor and instruments against the guide, then follow its staged acceptance checks.
