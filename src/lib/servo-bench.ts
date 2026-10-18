import type { ReportModel } from "./build-report";
import { servoFirmwareFiles } from "./servo-firmware";

const sections: ReportModel["sections"] = [
  {
    title: "Status, scope, and stop control",
    markdown: `This is a researched, **unbuilt** bench route. It has not been flashed, wired, measured, or physically validated, and it carries no performance or safety guarantee. It uses the original Raspberry Pi Pico RP2040 and the positional FEETECH FS90 sold as Pololu product 2818—not FS90R continuous rotation, FS90-FB, or SG92R. The existing SG92R project remains unchanged; this FS90 route is not a drop-in qualification for it.

The firmware limits commands, but it is not a hardware safety certification or interlock. No pulses does not prove that the shaft released or cannot move. Keep the external supply’s low-voltage barrel connection within reach: unplugging that barrel is the physical stop for servo power. USB powers only the Pico. Keep fingers, hair, tools, and fragile objects outside the possible travel before applying servo power.`,
  },
  {
    title: "Procurement and receiving inspection",
    markdown: `Acquire one original [Pico RP2040 with loose headers](https://www.adafruit.com/product/4883), one positional [FEETECH FS90 / Pololu 2818](https://www.pololu.com/product/2818), one regulated [5 V, 2 A supply](https://www.adafruit.com/product/276), one [2.1 mm female screw-terminal adapter](https://www.adafruit.com/product/368), one normally-open [momentary button](https://www.adafruit.com/product/1119), a [breadboard](https://www.adafruit.com/product/239), [male/male logic jumpers](https://www.adafruit.com/product/758), and either a [USB-A/Micro-B data cable](https://www.adafruit.com/product/592) or [USB-C/Micro-B data cable](https://www.adafruit.com/product/3878) to suit the host. Header soldering requires an iron, solder, stand, eye protection, and ventilation.

Use one [Adafruit 5515 shrouded servo adapter](https://www.adafruit.com/product/5515), plus one short separate common-ground lead and three logic jumpers (GP0 signal extension if needed, GP3 to button, button to GND). The Pico needs its two included 20-pin header strips; acquire one button 10-pack but use one button, and one jumper 40-pack but use only the required conductors. Tools required: a DC-voltage/continuity multimeter, wire stripper/cutter suited to 26 AWG, and a screwdriver fitting the terminal screws. Provide insulation and strain relief. The signal contact may enter the breadboard, but servo positive and negative must bypass breadboard and Pico rails. Terminate the power conductors with correctly stripped wire or a ferrule sized for the clamp; never clamp a loose Dupont pin. With everything unplugged, retain the adapter signal pin and prepare its power and ground ends for the screw clamp; modify the replaceable adapter, not the servo lead. Confirm the clamp can retain those conductors and the separate ground lead without exposed strands; stop if it cannot. A suitable splice/terminal is required if the clamp cannot accept the intended junction. This is a prepared cable assembly, not plug-and-play.

Identify the exact FS90 contacts using the [FS90 pinout from Pimoroni](https://shop.pimoroni.com/products/micro-angular-servo): red is supply, orange is signal, brown is ground. Compare the received FS90 markings and lead arrangement with the [Pololu product reference](https://www.pololu.com/product/2818); a different lead arrangement needs supplier clarification before power. Trace each servo-side contact through the unplugged adapter with continuity and label the prepared ends. Do not transfer colors between adapters or guess left/right from a rotated connector.

Record the exact received label. Pololu’s measured-current page reports 0.6 A stall at 6 V, while its linked PDF is marked **FS90-C** and reports 0.8 A at 6 V. Preserve that discrepancy rather than merging the values. The 2 A supply is planned headroom, not proof of transient response, connector quality, or current limiting. Do not deliberately stall the servo.`,
  },
  {
    title: "Unpowered topology and inspection",
    markdown: `Solder and inspect the Pico headers before wiring. With every source disconnected, use the official [numbered Pico pinout](https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf) and verify the servo adapter contacts. Wire this topology exactly:

~~~text
Host USB -> Pico USB only
Adapter positive -> servo POWER + only
Adapter negative -> servo GROUND (direct motor-current return)
                 -> Pico GND physical 3 (separate reference lead)
Pico GP0 physical 1 -> servo SIGNAL
Pico GP3 physical 5 -> normally-open button -> Pico GND physical 8
Pico GP25 -> onboard LED only
~~~

External positive has **no connection** to VBUS physical 40, VSYS physical 39, or 3V3(OUT) physical 36. Servo current does not use a breadboard rail, Pico power pin, or logic jumper. A four-leg button contains two internally common pairs: use unpowered continuity to identify them, then connect across the switched sides. Connecting the same common pair makes the input permanently active. Confirm GP3 reads released before attaching the servo. Stop on any uncertain pin number, connector fit, polarity, loose strand, bridge, or continuity result.`,
  },
  {
    title: "Firmware handoff and command behavior",
    markdown: `Install the original-Pico [CircuitPython UF2](https://circuitpython.org/board/raspberry_pi_pico/): hold BOOTSEL while attaching USB, copy that UF2 to RPI-RP2, and wait for the reboot to expose CIRCUITPY. This packet needs no external library bundle: it uses only built-in board, time, math, digitalio, and pwmio plus its own module. Copy **both** files to the CIRCUITPY root: copy firmware/code.py as code.py and firmware/servo_control.py as servo_control.py. The source packet owns the complete code; this guide intentionally does not duplicate it.

At boot the output duty is zero and the controller is disarmed. It must observe the button released continuously for at least 0.05 s. A press then begins at 1500 µs and slowly traces a triangle between 1450 and 1550 µs at no more than 50 µs/s, at 50 Hz. Release requests zero output on the next loop iteration (nominally 20 ms, not a real-time guarantee). Five seconds of continuous command forces zero output; release stably, then press again to rearm. A held-at-startup button never starts motion. Backward or non-finite clock values reset to zero output. The onboard LED means only “command active,” not actual shaft position. Serial telemetry reports state and commanded pulse, never fabricated position feedback.`,
  },
  {
    title: "Staged first test",
    markdown: `1. Leave the servo connector physically disconnected. Attach USB, confirm CIRCUITPY and serial, and let the released button arm. If available, use a logic analyzer or oscilloscope at GP0-to-GND to check 50 Hz, zero output before arming, the first 1500 µs command, immediate release, and the five-second timeout. The LED alone cannot verify pulse width. Complete this disconnected output test before connecting the servo.
2. Disconnect USB. Remove the servo horn and every link or load, secure the servo body, trace the signal/ground/power topology, verify supply polarity and nominal voltage, and inspect the screw clamps. Clear the entire travel envelope.
3. Reconnect USB first. Wait for the controller to boot disarmed with the button released. Do not press while a connected servo is unpowered. After inspections, connect external servo power; keep the barrel plug reachable.
4. Press briefly. The first command can jump toward center. Release and confirm the command stops; observe behavior without claiming a measured angle. Repeat long enough to observe the five-second timeout, then release and repress to confirm rearming.
5. Stop immediately for heat, persistent buzz, Pico reset, binding, supply sag, damaged insulation, odor, or unexpected motion. Do not widen the pulse range or raise a current limit to force movement. Remove external servo power before removing USB. A software crash can leave the last pulse until cleanup runs, so retain access to the barrel disconnect.

Only after unloaded checks should a lightweight paper pointer be fitted for angle observations. Attach no working load until supply voltage, current where instrumentation is available, motion, and clearances are recorded.`,
  },
  {
    title: "Engineering record and troubleshooting",
    markdown: `A worked static estimate for a 20 g mass at a horizontal 40 mm lever arm is m g r = 0.020 kg × 9.80665 m/s² × 0.040 m = **0.00784532 N·m**, or **0.08 kgf·cm**. An optional factor of three gives 0.02353596 N·m. This assumes gravity is perpendicular to a massless horizontal arm; arm mass, acceleration, friction, impacts, geometry, and losses remain excluded. Compare only with the published 1.3 kgf·cm stall value at 4.8 V as an upper stalled reference—not a continuous rating. Arithmetic margin does not establish usable torque. Review [torque and gearing theory](/learn?lesson=torque-gearing) before adding a load.

Use notes/bench-log.csv for date, exact variant, supply voltage at rest and moving, pulse bounds, observed angle, startup/release/timeout observations, measured current if suitable instrumentation is available, and notes. Angle and current are pending until measured; never backfill estimates as observations.

Diagnose in layers: no CIRCUITPY suggests the USB data cable, BOOTSEL procedure, or UF2; import/traceback suggests file names or firmware; no arm/start suggests button pair, pull-up, or startup-held state; LED command without motion suggests servo power, common ground, signal contact, or connector mapping; resets or sag suggest the power path; buzz or restricted travel suggests mechanical binding or an unsuitable variant. Depower before continuity or rewiring.`,
  },
  {
    title: "Export and transfer",
    markdown: `In Metatransformer choose New project → Pico + FS90 servo bench to obtain the source packet. Keep README.md, BUY_AND_BUILD.md, WIRING.md, ENGINEERING.md, both firmware files, and notes/bench-log.csv together. Export the project’s source bundle after reviewing it for private notes. A recipient can import it with \`pnpm workshop import /path/to/bench.workshop.json /path/to/new-bench\`, then register it with \`pnpm workshop register /path/to/new-bench\`. Use a new destination directory. Recheck exact hardware identity and wiring after transfer; source portability is not physical validation.`,
  },
];

const sources: ReportModel["sources"] = [
  { title: "Pimoroni — FS90 contact pinout (corroborating reference)", url: "https://shop.pimoroni.com/products/micro-angular-servo" },
  { title: "Adafruit — 5515 shrouded servo adapter", url: "https://www.adafruit.com/product/5515" },
  { title: "Pololu — FEETECH FS90 positional micro servo", url: "https://www.pololu.com/product/2818" },
  { title: "Pololu — FS90 measured specifications", url: "https://www.pololu.com/product/2818/specs" },
  { title: "Pololu — linked FS90-C specification PDF", url: "https://www.pololu.com/file/0J1435/FS90-specs.pdf" },
  { title: "Adafruit — original Raspberry Pi Pico RP2040", url: "https://www.adafruit.com/product/4883" },
  { title: "Adafruit — original Pico numbered pinout", url: "https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf" },
  { title: "Adafruit — regulated 5 V 2 A supply", url: "https://www.adafruit.com/product/276" },
  { title: "Adafruit — 2.1 mm female screw-terminal adapter", url: "https://www.adafruit.com/product/368" },
  { title: "CircuitPython — original Raspberry Pi Pico UF2", url: "https://circuitpython.org/board/raspberry_pi_pico/" },
  { title: "CircuitPython — pwmio reference", url: "https://docs.circuitpython.org/en/latest/shared-bindings/pwmio/index.html" },
];

export const servoBenchGuide: ReportModel = {
  title: "Buy and build — Pico + FS90 bounded servo bench",
  subtitle: "Printable procurement, assembly, firmware, and evidence handoff · researched but unbuilt",
  sections,
  sources,
};

const guideMarkdown = [
  `# ${servoBenchGuide.title}`,
  servoBenchGuide.subtitle,
  ...servoBenchGuide.sections.flatMap((section) => [`## ${section.title}`, section.markdown]),
  "## Sources",
  servoBenchGuide.sources.map((source) => `- [${source.title}](${source.url})`).join("\n"),
].filter((entry): entry is string => Boolean(entry)).join("\n\n");

const readme = `# FS90 bounded hold-to-run bench

Status: researched and unbuilt; no hardware, electrical, motion, or safety validation has been performed.

This source packet documents one exact route: original Pico RP2040 plus positional FEETECH FS90 / Pololu 2818. It does not replace or qualify the separate SG92R concept and has no 3D model. Start with [BUY_AND_BUILD.md](BUY_AND_BUILD.md), then verify [WIRING.md](WIRING.md) before copying both Python files to CIRCUITPY. Keep the external servo-power barrel disconnect reachable.
`;

const wiring = `# Wiring authority

All wiring and connector identification happen unpowered. Use Pico physical pin numbers and received connector markings; never infer a contact from insulation color.

| From | To | Constraint |
| --- | --- | --- |
| Host USB | Pico Micro-B | Host powers Pico only |
| GP0, physical 1 | Verified servo signal contact | 50 Hz command |
| Adapter negative | Servo ground directly, plus a separate lead to Pico GND physical 3 | Motor return bypasses Pico and breadboard |
| Adapter positive | Servo positive through suitable power conductor | Bypass breadboard and Pico |
| GP3, physical 5 | Normally-open button, then GND physical 8 | Internal pull-up; verify switched pairs |
| GP25 | Onboard LED | No external connection |

External positive must not touch VBUS 40, VSYS 39, or 3V3(OUT) 36. Use the Adafruit 5515 shrouded adapter prepared as described in BUY_AND_BUILD.md. Use its FS90 contact-reference procedure: verify received markings, identify servo contacts, then trace and label each adapter end with unpowered continuity. Do not clamp a loose Dupont pin in the barrel adapter; use properly stripped wire or a suitable ferrule. Servo current never travels through breadboard rails. Verify supply polarity, pinout, connector retention, common ground, and button continuity before power. Immediate stop: unplug the external supply’s low-voltage barrel connection. No pulses is not proof of release.
`;

const engineering = `# Engineering notes

This prototype has not been physically built or validated. [BUY_AND_BUILD.md](BUY_AND_BUILD.md) contains the assembly sequence, required tools, stop conditions and acceptance observations; [WIRING.md](WIRING.md) owns the endpoints. Record actual evidence before revising these limits.

## Command envelope

The controller is release-to-arm and hold-to-run. It commands 50 Hz pulses only from 1450 to 1550 µs, changes no faster than 50 µs/s, and stops after five seconds until another stable release. These software bounds are not a safety-rated interlock. Actual angle remains unmeasured.

## Static load example

For a 0.020 kg mass at a perpendicular 0.040 m lever arm, τ = mgr = 0.020 × 9.80665 × 0.040 = 0.00784532 N·m = 0.08 kgf·cm. An optional factor of three gives 0.02353596 N·m. This assumes gravity and a massless horizontal arm. The published 1.3 kgf·cm at 4.8 V is stall torque, an upper stalled reference rather than a continuous rating; computed margin cannot establish usable torque.

## Open evidence

Received model markings, horn angle, resting/moving supply voltage, motion current, thermal behavior, and loaded capability are pending measurement. Pololu reports a seller-measured 0.6 A stall current at 6 V; the linked FS90-C PDF reports 0.8 A at 6 V. Do not erase the model discrepancy or deliberately stall the unit. The planned 2 A supply does not guarantee transient response or current limiting.
`;

const benchLog = "date,exact_variant,supply_rest_v,supply_moving_v,min_pulse_us,max_pulse_us,observed_angle_deg,startup_observation,release_observation,timeout_observation,current_a_if_instrumented,notes\n";

export const servoBenchFiles: Record<string, string> = {
  "README.md": readme,
  "ENGINEERING.md": engineering,
  "WIRING.md": wiring,
  "BUY_AND_BUILD.md": guideMarkdown,
  "notes/bench-log.csv": benchLog,
  ...servoFirmwareFiles,
};
