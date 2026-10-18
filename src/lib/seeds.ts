import { addLearningLinks, getLearningFiles } from "./learning";
import type { CatalogItem, ModelKind, Template } from "./contracts";

const SEEDED_AT = "2026-10-17T00:00:00.000Z";

type TemplateSeed = Template & {
  parameters: Record<string, number>;
  files: Record<string, string>;
};

const source = (id: string, title: string, url: string) => ({
  id,
  title,
  url,
  capturedAt: SEEDED_AT,
});

const catalogItem = (
  item: Omit<CatalogItem, "version" | "createdAt" | "updatedAt" | "ownedQuantity" | "notes">,
): CatalogItem => ({
  ...item,
  ownedQuantity: 0,
  notes: "",
  version: 1,
  createdAt: SEEDED_AT,
  updatedAt: SEEDED_AT,
});

export const seedCatalog: CatalogItem[] = [
  catalogItem({
    id: "raspberry-pi-pico",
    name: "Raspberry Pi Pico",
    kind: "part",
    category: "microcontroller",
    description: "RP2040-based microcontroller board. The linked manufacturer page is documentation, not a compatibility or availability guarantee.",
    manufacturer: "Raspberry Pi",
    model: "Pico",
    tags: ["microcontroller", "rp2040"],
    specs: [
      { label: "Microcontroller", value: "RP2040", evidence: "document", sourceId: "src-rpi-pico", quote: "Designed by Raspberry Pi, RP2040" },
    ],
    sources: [source("src-rpi-pico", "Raspberry Pi Pico product page", "https://www.raspberrypi.com/products/raspberry-pi-pico/")],
  }),
  catalogItem({
    id: "raspberry-pi-5",
    name: "Raspberry Pi 5",
    kind: "part",
    category: "single-board computer",
    description: "Raspberry Pi single-board computer. Consult the linked official documentation before selecting power, cooling, or peripherals.",
    manufacturer: "Raspberry Pi",
    model: "5",
    tags: ["computer", "linux", "single-board-computer"],
    specs: [
      { label: "CPU", value: "2.4 GHz quad-core 64-bit Arm Cortex-A76", evidence: "document", sourceId: "src-rpi-5", quote: "2.4GHz quad-core 64-bit Arm Cortex-A76 CPU" },
    ],
    sources: [source("src-rpi-5", "Raspberry Pi 5 product page", "https://www.raspberrypi.com/products/raspberry-pi-5/")],
  }),
  catalogItem({
    id: "adafruit-sg92r",
    name: "Adafruit SG92R micro servo",
    kind: "part",
    category: "actuator",
    description: "Small positional hobby servo sold by Adafruit. Mechanical envelope, load, current draw, and control limits must be checked against the linked documentation and the actual unit.",
    manufacturer: "Adafruit",
    model: "SG92R",
    tags: ["servo", "actuator"],
    specs: [],
    sources: [source("src-adafruit-sg92r", "Adafruit SG92R micro servo product page", "https://www.adafruit.com/product/169")],
  }),
  catalogItem({
    id: "adafruit-bme280",
    name: "Adafruit BME280 breakout",
    kind: "part",
    category: "sensor",
    description: "Breakout board for the BME280 environmental sensor. The product documentation describes temperature, humidity, and barometric pressure sensing; it does not establish suitability for a particular enclosure or environment.",
    manufacturer: "Adafruit",
    model: "BME280 breakout",
    tags: ["sensor", "temperature", "humidity", "pressure"],
    specs: [
      { label: "Measures", value: "temperature, humidity, barometric pressure", evidence: "document", sourceId: "src-adafruit-bme280", quote: "temperature, humidity, and barometric pressure" },
    ],
    sources: [source("src-adafruit-bme280", "Adafruit BME280 breakout product page", "https://www.adafruit.com/product/2652")],
  }),
  catalogItem({
    id: "generic-m3-fasteners",
    name: "Generic M3 fasteners",
    kind: "part",
    category: "hardware",
    description: "Unbranded M3 screws, nuts, and washers selected to suit the measured stack-up. Length, head style, material, and quantity are intentionally unspecified.",
    tags: ["fastener", "metric"],
    specs: [{ label: "Thread", value: "M3", evidence: "manual" }],
    sources: [],
  }),
  catalogItem({
    id: "generic-breadboard",
    name: "Generic solderless breadboard",
    kind: "part",
    category: "prototyping",
    description: "Unbranded solderless breadboard for low-voltage bench prototyping. Rail continuity and contact layout vary; inspect and meter the actual board.",
    tags: ["breadboard", "prototype"],
    specs: [],
    sources: [],
  }),
  catalogItem({
    id: "tool-soldering-iron",
    name: "Soldering iron",
    kind: "tool",
    category: "electronics tool",
    description: "A temperature-controlled soldering iron appropriate for electronics assembly. No manufacturer or model is assumed.",
    tags: ["soldering", "assembly"],
    specs: [],
    sources: [],
  }),
  catalogItem({
    id: "tool-digital-multimeter",
    name: "Digital multimeter",
    kind: "tool",
    category: "test equipment",
    description: "A digital multimeter suitable for continuity and low-voltage measurements. Verify rating and lead condition before use.",
    tags: ["measurement", "electrical"],
    specs: [],
    sources: [],
  }),
  catalogItem({
    id: "tool-screwdriver",
    name: "Screwdriver",
    kind: "tool",
    category: "hand tool",
    description: "A screwdriver matching the selected fastener head. No manufacturer or model is assumed.",
    tags: ["assembly", "hand-tool"],
    specs: [],
    sources: [],
  }),
  catalogItem({
    id: "tool-fdm-printer",
    name: "FDM 3D printer",
    kind: "tool",
    category: "fabrication tool",
    description: "An FDM printer capable of producing the chosen material and geometry. Calibrate dimensions on the actual machine before relying on fits.",
    tags: ["fabrication", "3d-printing"],
    specs: [],
    sources: [],
  }),
  catalogItem({
    id: "generic-usb-data-cable",
    name: "Generic USB data cable",
    kind: "part",
    category: "cable",
    description: "A data-capable USB cable with a Micro-B plug for the original Raspberry Pi Pico and a host-compatible plug. Charge-only cables will not load firmware or provide a serial console.",
    tags: ["usb", "data", "power"],
    specs: [],
    sources: [],
  }),
  catalogItem({
    id: "generic-jumper-wires",
    name: "Jumper wire set (four wires)",
    kind: "part",
    category: "prototyping",
    description: "Four insulated breadboard jumper wires with ends matching the fitted Pico and sensor headers. Wire colors are conventions only; verify each endpoint from its label.",
    tags: ["jumper-wire", "prototype"],
    specs: [],
    sources: [],
  }),
];

const commonAgentInstructions = `# Workshop project instructions

Read README.md and ENGINEERING.md before changing the project. Preserve project.json schemaVersion and keep parameter changes numeric. Treat the model as an illustrative concept, not proof of mechanical, electrical, thermal, or regulatory fitness.

Use plain language by default, define unfamiliar terms with GLOSSARY.md, and link prerequisites or next steps from LEARNING_PATH.md. Adapt detail to the user’s stated experience and questions; do not infer competence from jargon. Keep exact part numbers, pins, units, limits, and validation requirements intact when explaining simply. Update START_HERE.md and the learning links when the build changes.

Do not execute downloaded or generated source automatically. Record assumptions, measurements, and validation results in the ordinary project documents. Never claim a physical test that was not actually performed.
`;

const claudePointer = `# Claude project context

Follow [AGENTS.md](AGENTS.md), then read [ENGINEERING.md](ENGINEERING.md) for requirements, risks, and the validation plan.
`;

const seedDefinitions: TemplateSeed[] = [
  {
    id: "linkage",
    title: "Four-bar linkage",
    description: "Explore a planar four-bar mechanism with editable link dimensions and a deliberately illustrative kinematic preview.",
    category: "mechanisms",
    level: "intermediate",
    model: "linkage",
    skills: ["kinematics", "measurement", "fabrication"],
    partIds: ["generic-m3-fasteners", "tool-screwdriver", "tool-fdm-printer"],
    parameters: { crank: 25, coupler: 65, rocker: 50, ground: 70, speed: 1 },
    files: {
      "README.md": `# Four-bar linkage study

This project studies how crank, coupler, rocker, and ground lengths affect planar motion. Start with the interactive model, then use [ENGINEERING.md](ENGINEERING.md) to turn the concept into a measured bench prototype. The preview is illustrative kinematics, not a tolerance, strength, or collision analysis.

- Edit numeric dimensions in project parameters.
- Record candidate pivot hardware and fabrication tolerances in \`notes/measurements.md\`.
- Review [MODEL.md](MODEL.md) before transferring geometry to CAD.
`,
      "ENGINEERING.md": `# Engineering plan — four-bar linkage

## Outcome and untested status
Produce a hand-driven planar linkage that completes the intended range without binding. This seed has not been physically built or validated; the on-screen motion is only a concept visualization.

## Requirements
- Four rigid links with measured pivot spacing corresponding to crank, coupler, rocker, and ground parameters.
- Free-running joints with controlled axial play.
- A stable ground link and clearance through the complete intended sweep.

## Architecture and interfaces
The ground fixes two pivots. The crank connects the input ground pivot to the coupler; the coupler connects to the rocker; the rocker closes the loop at the output ground pivot. Parameter values are millimetre-scale design inputs, while fabrication drawings/CAD remain the dimensional authority. The human hand is the initial drive interface.

## Real BOM and tools
Use four fabricated links, suitable M3 screws/nuts/washers or measured alternatives, spacers as required, a screwdriver, calipers/ruler, and optionally an FDM printer. Material, screw length, hole fit, and washer stack must be chosen from actual measurements; the generic catalog entries do not specify them.

## Staged assembly
1. Sketch the four pivot centers and check that the chosen lengths can close as a quadrilateral over the desired motion.
2. Make a disposable card or sheet prototype and pin the joints loosely.
3. Rotate the input by hand, marking dead points, collisions, and the useful output arc.
4. Transfer corrected center distances to CAD or a fabrication drawing.
5. Fabricate one link set, deburr holes, assemble with washers/spacers, and tighten only enough to constrain wobble without binding.

## Validation and expected observations
- With power absent, the input should move through the intended range by hand without a sudden rise in resistance.
- Pivot centers should measure within the tolerance chosen in the drawing; record actual values.
- Links should remain in their intended planes, with no screw heads or spacers colliding.
- Compare observed rocker endpoints with the preview qualitatively; divergence is a prompt to re-measure, not evidence the hardware is wrong.

## Modifications and native-tool handoff
Try one dimension at a time and save a project copy before comparing motion. Hand measured dimensions and clearance notes to a CAD tool for hole geometry, spacers, fillets, and manufacturing drawings; export source formats without converting them in Workshop.

## Risks, limitations, and unknowns
Dead-center locking, pinch points, fastener loosening, layer-direction weakness, accumulated hole clearance, and out-of-plane bending are unresolved. Loads, fatigue life, speed, motor sizing, and guarding have not been calculated or tested.
`,
      "MODEL.md": `# Model notes

The viewer consumes \`Project.model = "linkage"\` and the numeric parameters \`crank\`, \`coupler\`, \`rocker\`, \`ground\`, and \`speed\`. It is useful for qualitative exploration only. It does not model joint clearance, branch changes, interference, force, material, or motor behavior.
`,
      "notes/measurements.md": `# Measurements

Record intended and measured pivot spacing, hole diameter, spacer thickness, axial play, motion endpoints, and any binding locations here.
`,
    },
  },
  {
    id: "desk-robot",
    title: "One-servo desk creature",
    description: "Prototype an expressive single-servo desk creature while keeping mechanism loads and electrical unknowns explicit.",
    category: "robotics",
    level: "beginner",
    model: "robot",
    skills: ["servo control", "prototyping", "mechanism design"],
    partIds: ["raspberry-pi-pico", "adafruit-sg92r", "generic-breadboard", "generic-m3-fasteners", "tool-digital-multimeter", "tool-screwdriver", "tool-fdm-printer"],
    parameters: { angle: 30 },
    files: {
      "README.md": `# One-servo desk creature

Explore a small character whose visible motion comes from one positional servo. The model's angle is illustrative. Read [ENGINEERING.md](ENGINEERING.md) before wiring or fabricating, and confirm every pinout and voltage against the exact boards in hand.

The firmware file is a reviewable starting point, not a flashed or tested result. [WIRING.md](WIRING.md) intentionally requires measurement and documentation before power-on.
`,
      "ENGINEERING.md": `# Engineering plan — one-servo desk creature

## Outcome and untested status
Create a stable desk-scale creature that performs one slow, repeatable expressive motion. This seed has not been electrically, mechanically, or physically validated.

## Requirements
- One bounded motion driven by a positional micro servo.
- A stable base, accessible power disconnect, strain relief, and no exposed pinch point in normal interaction.
- Controller and servo power arrangement selected from their current documentation and measured hardware.
- Motion limits chosen below collision and stall points.

## Architecture and interfaces
The controller emits a servo control signal; a separately reasoned power path supplies the actuator; grounds are joined only according to the verified wiring plan. A horn/link transfers rotation to one visible feature. Firmware exposes neutral angle, travel limits, and dwell timing. The project \`angle\` parameter drives only the concept viewer.

## Real BOM and tools
Candidate parts are a Raspberry Pi Pico, Adafruit SG92R-class micro servo, solderless breadboard, jumpers, a measured power source, switch/disconnect, enclosure/link hardware, and optional M3 fasteners. Use a digital multimeter, screwdriver, and optionally soldering iron/FDM printer. The catalog does not prove electrical or mechanical compatibility.

## Staged assembly
1. Inspect the exact controller and servo markings; download their current manufacturer documentation.
2. Draw the signal, power, and ground connections in WIRING.md, including supply voltage/current reasoning.
3. Test the controller output without the servo, then test the servo unloaded with a conservative travel range and immediate disconnect available.
4. Measure safe horn angles by approaching limits slowly; stop on buzzing, heat, or stalled motion.
5. Build a cardboard mechanism first, then transfer measured geometry to CAD/fabrication.
6. Route wires away from the horn and verify the base cannot tip through the motion.

## Validation and expected observations
- Supply polarity and voltage should match the documented plan before connection.
- Unloaded motion should be smooth and stay inside recorded bounds without sustained buzzing.
- Added mechanism load should not cause resets, excessive heating, stalling, or base lift.
- Ten slow cycles should return near the same visible endpoints; record drift and looseness rather than assuming repeatability.

## Modifications and native-tool handoff
Change one of angle, link length, or dwell time per test. Hand the measured horn envelope and fastener geometry to CAD; hand verified pin assignments and limits to the firmware editor. Keep editable source files native.

## Risks, limitations, and unknowns
Servo current peaks, actual supply capability, horn fit, stall torque, linkage pinch points, noise, thermal rise, and enclosure stability remain unknown until measured. Do not power the servo from a controller rail without documentation establishing that arrangement.
`,
      "WIRING.md": `# Wiring worksheet

Do not wire from color alone. Record the exact servo lead functions, controller pin identifier, supply rating, measured supply voltage, ground arrangement, and source-document links here before applying power.
`,
      "firmware/main.py": `# Review against the exact controller and servo documentation before use.
# This intentionally contains no board-specific pin assignment or auto-running motion.

NEUTRAL_DEGREES = 90
MIN_DEGREES = 70
MAX_DEGREES = 110

def requested_motion():
    return [NEUTRAL_DEGREES, MIN_DEGREES, NEUTRAL_DEGREES, MAX_DEGREES]
`,
    },
  },
  {
    id: "cyberdeck",
    title: "Personal computer build",
    description: "Plan a compact Raspberry Pi 5 computer around measurable interfaces, power, thermals, display, input, and enclosure constraints.",
    category: "computing",
    level: "intermediate",
    model: "cyberdeck",
    skills: ["systems integration", "enclosure design", "thermal planning"],
    partIds: ["raspberry-pi-5", "generic-m3-fasteners", "tool-digital-multimeter", "tool-screwdriver", "tool-fdm-printer"],
    parameters: { width: 160 },
    files: {
      "README.md": `# Personal computer build

Plan a compact computer around a Raspberry Pi 5 and explicitly selected display, input, storage, power, cooling, and enclosure components. The viewer width is an envelope prompt, not a manufacturing dimension. Use [ENGINEERING.md](ENGINEERING.md) as the integration checklist.
`,
      "ENGINEERING.md": `# Engineering plan — compact personal computer

## Outcome and untested status
Produce a portable or desk-bound computer assembly that boots reliably, exposes the intended ports, manages heat, and can be serviced. This seed is a planning artifact and has not been assembled, powered, thermally tested, or certified.

## Requirements
- Raspberry Pi 5 board with a documented power source, cooling method, storage, display, keyboard/pointing input, and accessible shutdown path.
- Enclosure clearance for connectors, cables, airflow, and service access.
- No battery integration until a specific protected pack, charger, wiring, and safety approach are reviewed.

## Architecture and interfaces
The compute board connects to storage, display, human input, power, and cooling subsystems. Each interface must identify connector type, cable exit direction, bend clearance, and power dependency. The \`width\` parameter is only a concept envelope; CAD owns final board mounting and cutout dimensions.

## Real BOM and tools
Begin with a Raspberry Pi 5, documented compatible power supply, storage, display plus interface cable, keyboard/pointing device, cooling solution, enclosure material, standoffs, and selected M3 or board-appropriate fasteners. Tools include screwdriver, digital multimeter, measuring tools, and optionally an FDM printer. Display, power, storage, and thermal parts are intentionally not guessed by this seed.

## Staged assembly
1. Select exact subsystems and collect their primary documentation and dimensional drawings.
2. Bench-connect board, cooling, storage, display, input, and power without an enclosure.
3. Boot, shut down cleanly, exercise intended I/O, and log idle/load temperature and any throttling with the chosen software tools.
4. Make a full-scale card mock-up including cable bodies and bend radii.
5. Transfer measured mounting holes, connector keep-outs, vents, and service openings to CAD.
6. Assemble without pinching cables; repeat boot, I/O, and thermal observations.

## Validation and expected observations
- Repeated cold boots should reach the chosen operating environment without power warnings.
- Display and input should reconnect after a normal restart.
- Connectors should insert without enclosure flex and cables should remain below their forced bend limit.
- Under a documented workload, temperature should stabilize without unexpected throttling; record ambient conditions and results.

## Modifications and native-tool handoff
Change the width only after updating the physical envelope study. CAD receives measured board/cable geometry; system configuration remains in native text files; thermal observations remain alongside the build record.

## Risks, limitations, and unknowns
Power transients, cooling performance, display compatibility, cable routing, EMI/ESD, material flammability, port wear, and battery safety are unresolved. The seed makes no portability, runtime, or regulatory claim.
`,
      "interfaces.csv": `subsystem,exact_part,connector,power_need,mechanical_keepout,status
display,,,,,unselected
storage,,,,,unselected
input,,,,,unselected
cooling,,,,,unselected
power,,,,,unselected
`,
      "notes/validation.md": `# Validation log

Record software version, ambient temperature, power source, workload, temperatures, throttling indicators, boot result, and observed connector or enclosure issues.
`,
    },
  },
  {
    id: "sensor",
    title: "Pico + BME280 temperature indicator",
    description: "Wire a BME280 to an original Raspberry Pi Pico, log environmental readings, and drive the onboard LED with temperature hysteresis.",
    category: "electronics",
    level: "beginner",
    model: "none",
    skills: ["CircuitPython", "I2C wiring", "serial logging", "hysteresis"],
    partIds: ["raspberry-pi-pico", "adafruit-bme280", "generic-breadboard", "generic-usb-data-cable", "generic-jumper-wires", "tool-digital-multimeter", "tool-soldering-iron"],
    parameters: {},
    files: {
      "README.md": `# Pico + BME280 temperature indicator

Build a USB-powered environmental monitor that logs temperature, humidity, and pressure once per second. The original Raspberry Pi Pico's onboard GP25 LED turns on at or above 28 °C, stays in its previous state between 26 °C and 28 °C, and turns off at or below 26 °C. No external LED or light driver is used. This template has been researched and coded, but not physically assembled or measured.

## Learning path

1. Read the requirements, exact interfaces, BOM, and acceptance stages in [ENGINEERING.md](ENGINEERING.md).
2. Confirm that your board is the original non-W Raspberry Pi Pico and read every silkscreen before connecting anything.
3. With USB disconnected, make the four connections in [WIRING.md](WIRING.md); do not substitute pins.
4. Install the official Pico CircuitPython UF2 as described in [WIRING.md](WIRING.md).
5. Install the matching-major-version BME280 libraries in CIRCUITPY/lib using [WIRING.md](WIRING.md).
6. Copy [firmware/code.py](firmware/code.py) to the CIRCUITPY drive as code.py.
7. Open the serial console, confirm the address message, CSV header, and live rows described in [firmware/behavior.md](firmware/behavior.md).
8. Run the threshold and safe sensor-disconnect checks in [ENGINEERING.md](ENGINEERING.md).
9. Record actual observations in [notes/bench-log.csv](notes/bench-log.csv); keep pending measurements identified as pending until observed.
`,
      "ENGINEERING.md": `# Engineering plan — Pico + BME280 temperature indicator

## Outcome and untested status

The build shall use an original non-W Raspberry Pi Pico and an Adafruit BME280 breakout to report temperature, relative humidity, and pressure over USB serial and show a temperature threshold on the Pico's onboard GP25 LED. The firmware and instructions are complete, but this seed has not been physically built, electrically inspected, or calibrated. Every result in notes/bench-log.csv is therefore pending.

## Concrete requirements

- Power the Pico only through its USB connector for this build and power the breakout from Pico pin 36, 3V3(OUT). Never connect Pico VBUS or 5 V to a GPIO pin.
- Use I2C0 on GP0 for SDA and GP1 for SCL at the exact physical pins listed below.
- Accept one detected BME280 at 0x76 or 0x77. Treat no supported address as disconnected and both supported addresses as ambiguous unless ADDRESS is explicitly selected in firmware/code.py.
- Sample all three measurements once per second and print CSV columns timestamp,temp_c,humidity_pct,pressure_hpa,led.
- Turn the onboard LED on at temperature >= 28 °C and off at temperature <= 26 °C. Preserve its prior state strictly between those limits.
- On initialization or read failure, immediately clear the normal indication, print a clear serial error, flash the LED at 0.2-second intervals, and retry. A fault must never leave a stale steady-on healthy indication.
- Keep firmware editable as ordinary CircuitPython source; do not vendor third-party driver code into the project.

## Chosen architecture

USB supplies and programs the Pico. The Pico's regulated 3.3 V output supplies the BME280 breakout. A four-wire I2C connection carries measurements to CircuitPython using busio.I2C(board.GP1, board.GP0). The Adafruit driver converts raw sensor data. A pure hysteresis function decides the normal indicator state, and digitalio drives the original Pico's onboard LED at GP25. USB serial carries status and CSV records to the host.

## Exact interface table

| Boundary | Source endpoint | Destination endpoint | Contract | Status |
| --- | --- | --- | --- | --- |
| Sensor power | Pico physical pin 36, 3V3(OUT) | BME280 VIN | 3.3 V supply | Chosen; voltage measurement pending |
| Common return | Pico physical pin 38, GND | BME280 GND | Common ground | Chosen; continuity inspection pending |
| I2C data | Pico physical pin 1, GP0 | BME280 SDI/SDA | I2C0 SDA | Chosen; bus observation pending |
| I2C clock | Pico physical pin 2, GP1 | BME280 SCK/SCL | I2C0 SCL | Chosen; bus observation pending |
| Indicator | RP2040 GP25 | Original Pico onboard LED | digital output, steady normal state / flashing fault | Chosen; visual observation pending |
| Host data and power | Host USB | Pico Micro-B USB | USB power, CIRCUITPY storage, serial console | Cable data capability pending verification |
| Sensor identity | I2C scan | Adafruit driver | exactly one of 0x76 or 0x77, or explicit ADDRESS selection | Actual address pending scan |

## BOM and tools

Required parts: one original non-W Raspberry Pi Pico, one Adafruit BME280 breakout, one data-capable USB cable ending in Micro-B at the Pico, four jumper wires, and a solderless breadboard if using fitted male headers. Both boards need compatible headers or another secure removable connection.

Required host tools: a computer able to mount USB storage, a CircuitPython-capable serial editor such as Thonny, and the official Pico CircuitPython UF2 plus a matching-major-version CircuitPython library bundle.

A digital multimeter is recommended for unpowered continuity and powered 3.3 V checks. A soldering iron is optional and is needed only if headers are not already fitted; soldering is outside the powered wiring steps. No external LED, resistor, driver, enclosure, 3D printer, or separate supply is required.

## Staged assembly and acceptance

1. **Identity check:** compare the actual board label and pin silkscreens with WIRING.md. Expected: an original non-W Pico and four unambiguous endpoints; stop if labels do not match.
2. **Unpowered wiring:** disconnect USB, make the four connections, and inspect each endpoint. Expected: GP0-to-SDI/SDA, GP1-to-SCK/SCL, 3V3(OUT)-to-VIN, and GND-to-GND with no VBUS connection.
3. **Runtime install:** load the official UF2 and required matching bundle libraries, then copy firmware/code.py as CIRCUITPY/code.py. Expected: CIRCUITPY remounts and the serial console opens without an import error.
4. **Address acceptance:** power the intact circuit and read serial output. Expected: exactly one message naming 0x76 or 0x77 followed by the CSV header. If both appear, set ADDRESS to the intended device only after identifying it; if neither appears, the LED flashes and initialization retries.
5. **Logging acceptance:** observe at least ten rows at roughly one-second intervals. Expected: five comma-separated fields per row, numeric temperature/humidity/pressure values, and led equal to 0 or 1. Record the actual values; plausible-looking output is not calibration evidence.
6. **Threshold acceptance:** first note stable ambient temperature. Temporarily set LOW_C and HIGH_C close around that observed value while preserving LOW_C < HIGH_C, then move the board between ordinary room locations or allow gentle ambient change. Do not use a flame, hot plate, heat gun, or other forced heating. Expected: LED turns on only at/above HIGH_C, stays unchanged in the band, and turns off only at/below LOW_C. Restore 26 and 28 afterward if those are the desired operating limits.
7. **Fault and recovery acceptance:** disconnect USB before removing the sensor connections. Reconnect USB with the sensor absent. Expected: a clear error repeats and the LED flashes rather than holding a normal steady state. Disconnect USB again, restore all four sensor wires, then repower. Expected: detection and CSV rows resume without editing firmware.

## Measurement and calibration uncertainties

Actual I2C address, 3.3 V rail voltage, sample interval tolerance, sensor offset, repeatability, response time, local self-heating, airflow, altitude-dependent pressure interpretation, humidity accuracy, and the effect of USB/Pico heat are unmeasured. The breakout's placement near the Pico may bias temperature. Record comparisons with a traceable reference and controlled conditions before applying offsets; this tutorial makes no physical accuracy or environmental-control claim.

## Editable artifacts

firmware/code.py is the source of truth for behavior. WIRING.md owns the physical connection instructions. notes/bench-log.csv receives observations without rewriting them as specifications. Third-party driver licensing remains with the downloaded Adafruit CircuitPython library bundle; this template does not vendor or modify that code.
`,
      "WIRING.md": `# Wiring and CircuitPython setup

## Check the exact hardware first

This tutorial targets the original Raspberry Pi Pico, not a Pico W or another RP2040 board. Read the labels on your own board and breakout. The [official CircuitPython Raspberry Pi Pico board page](https://circuitpython.org/board/raspberry_pi_pico/) identifies the original Pico build, its onboard LED on GP25, the BOOTSEL UF2 process, and the board's 3.3 V GPIO limits. The [Adafruit BME280 CircuitPython guide](https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/python-circuitpython-test) documents VIN, GND, I2C wiring, library setup, and the breakout's 0x77 default / 0x76 address-jumper behavior. The [Adafruit BME280 driver example](https://docs.circuitpython.org/projects/bme280/en/latest/examples.html) documents the Pico bus construction and driver API used here.

Disconnect USB before adding, removing, or correcting wires. This mapping is exact for the selected boards; do not infer substitute pins from wire color or a different board's diagram.

## Four connections

| Original Pico endpoint | Physical pin | Adafruit BME280 endpoint | Purpose |
| --- | ---: | --- | --- |
| GP0 | 1 | SDI/SDA | I2C data |
| GP1 | 2 | SCK/SCL | I2C clock |
| 3V3(OUT) | 36 | VIN | breakout power |
| GND | 38 | GND | common return |

    ORIGINAL PICO                              ADAFRUIT BME280
    physical 1  GP0  (SDA)  ----------------> SDI / SDA
    physical 2  GP1  (SCL)  ----------------> SCK / SCL
    physical 36 3V3(OUT)     ----------------> VIN
    physical 38 GND          ----------------> GND

USB powers the Pico. There is no wire from VBUS to the sensor and no external LED connection. Before applying power, trace all four wires endpoint-to-endpoint against the printed silkscreens. If you use a multimeter, do continuity checks only while unpowered, then check the 3V3(OUT)-to-GND voltage after the inspection.

## Install CircuitPython and libraries

1. Download the official UF2 for Raspberry Pi Pico from the [CircuitPython board page](https://circuitpython.org/board/raspberry_pi_pico/).
2. Hold BOOTSEL while connecting the Pico to USB. Release it when the RPI-RP2 drive appears, then copy the UF2 to that drive. The board restarts and mounts as CIRCUITPY.
3. From the [CircuitPython Libraries page](https://circuitpython.org/libraries), download the library bundle whose major version matches the installed CircuitPython major version.
4. Copy the complete adafruit_bme280 directory, the adafruit_bus_device directory, and the adafruit_register directory from that bundle into CIRCUITPY/lib. Keep the bundle's included licenses with your downloaded bundle; do not copy driver source into this project.
5. Copy firmware/code.py from this project to the root of CIRCUITPY as code.py.

## Serial console and address evidence

In Thonny, select the CircuitPython interpreter/port for the Pico and open View > Shell. Another CircuitPython-capable editor may expose the same USB serial console. Save the first startup message: it must report a detected BME280 at 0x76 or 0x77. The firmware scans rather than assuming the breakout's default. If it sees neither address, it reports a disconnected/not-found fault. If it sees both, it refuses to guess; identify the intended board and set ADDRESS near the top of code.py to 0x76 or 0x77.

Expected healthy output begins like this (numbers will differ):

    # BME280 ready at 0x77
    timestamp,temp_c,humidity_pct,pressure_hpa,led
    12.3,23.41,38.22,831.54,0
`,
      "evidence.csv": `interface,documentation_source,documented_or_chosen_claim,pin_or_connector,status
board identity,https://circuitpython.org/board/raspberry_pi_pico/,original Pico CircuitPython target with onboard LED on GP25,GP25,documented; actual board inspection pending
sensor bus,https://docs.circuitpython.org/projects/bme280/en/latest/examples.html,"Pico example constructs I2C with SCL GP1 and SDA GP0",GP1 and GP0,documented; bench detection pending
sensor wiring,https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/python-circuitpython-test,"breakout uses VIN GND and I2C; default address 0x77 or 0x76 with address jumper",VIN GND SCK/SCL SDI/SDA,documented; actual address pending
indicator,https://circuitpython.org/board/raspberry_pi_pico/,use original Pico onboard LED instead of external output stage,GP25,chosen; visual test pending
threshold,project requirement,"on at >=28 C; off at <=26 C; retain state between",firmware constants,chosen; physical test pending
fault state,project requirement,"clear steady state flash at 0.2 s and retry",firmware loop,implemented; hardware test pending
`,
      "firmware/behavior.md": `# Firmware behavior

The chosen control measurement is BME280 temperature in degrees Celsius. HIGH_C is 28 and LOW_C is 26. At or above HIGH_C the original Pico's onboard GP25 LED is steadily on. At or below LOW_C it is steadily off. Between the two thresholds it retains its previous normal state, preventing chatter.

Every successful one-second sample prints timestamp,temp_c,humidity_pct,pressure_hpa,led, where timestamp is seconds since the CircuitPython runtime started and led is 0 or 1. A comment-prefixed startup line records the scanned sensor address.

The scanner accepts 0x76 or 0x77. No supported address raises a not-found fault. Both addresses raise an ambiguity fault unless ADDRESS is explicitly set to the intended address. An initialization or read exception immediately turns off the previous steady indication, prints a comment-prefixed error, flashes the LED at 0.2-second intervals, and retries initialization. This distinguishes a fault from both normal steady states.

Threshold tests are software and bench checks only; they do not establish sensor accuracy or physical performance. Record the actual address and readings in notes/bench-log.csv.
`,
      "firmware/code.py": `"""BME280 CSV logger and temperature indicator for an original Raspberry Pi Pico."""

import time

import board
import busio
import digitalio
from adafruit_bme280 import basic as adafruit_bme280


HIGH_C = 28.0
LOW_C = 26.0
SAMPLE_SECONDS = 1.0
ERROR_FLASH_SECONDS = 0.2

# Leave as None for automatic selection when exactly one supported address is found.
# If the scan reports both supported addresses, set this to 0x76 or 0x77 only
# after identifying which physical sensor this program should use.
ADDRESS = None
SUPPORTED_SENSOR_ADDRESSES = (0x76, 0x77)


def update_indicator(temp_c, previous, high, low):
    """Return the hysteretic LED state without accessing hardware."""
    if low >= high:
        raise ValueError("LOW_C must be less than HIGH_C")
    if temp_c >= high:
        return True
    if temp_c <= low:
        return False
    return bool(previous)


def choose_sensor_address(scanned_addresses, requested_address=None):
    """Choose one supported address or raise a clear sensor fault."""
    found = tuple(address for address in SUPPORTED_SENSOR_ADDRESSES if address in scanned_addresses)
    if requested_address is not None:
        if requested_address not in SUPPORTED_SENSOR_ADDRESSES:
            raise ValueError("ADDRESS must be None, 0x76, or 0x77")
        if requested_address not in found:
            raise RuntimeError("requested BME280 address 0x%02X was not detected" % requested_address)
        return requested_address
    if not found:
        raise RuntimeError("BME280 not found at 0x76 or 0x77; check power and I2C wiring")
    if len(found) > 1:
        raise RuntimeError("BME280 scan is ambiguous (0x76 and 0x77); set ADDRESS explicitly")
    return found[0]


def scan_i2c(i2c):
    """Return an I2C scan while always releasing the shared bus lock."""
    while not i2c.try_lock():
        pass
    try:
        return tuple(i2c.scan())
    finally:
        i2c.unlock()


def initialize_sensor(i2c):
    """Scan for and initialize the selected BME280."""
    address = choose_sensor_address(scan_i2c(i2c), ADDRESS)
    sensor = adafruit_bme280.Adafruit_BME280_I2C(i2c, address=address)
    print("# BME280 ready at 0x%02X" % address)
    return sensor


def flash_fault(led):
    """Show one off/on/off fault pulse; the caller retries afterward."""
    led.value = False
    time.sleep(ERROR_FLASH_SECONDS)
    led.value = True
    time.sleep(ERROR_FLASH_SECONDS)
    led.value = False


def run():
    i2c = busio.I2C(board.GP1, board.GP0)
    led = digitalio.DigitalInOut(board.GP25)
    led.direction = digitalio.Direction.OUTPUT
    led.value = False
    sensor = None
    indicator_state = False
    header_printed = False

    while True:
        if sensor is None:
            try:
                sensor = initialize_sensor(i2c)
                if not header_printed:
                    print("timestamp,temp_c,humidity_pct,pressure_hpa,led")
                    header_printed = True
            except Exception as error:
                led.value = False
                indicator_state = False
                print("# ERROR: sensor initialization failed: %s; retrying" % error)
                flash_fault(led)
                continue

        try:
            temp_c = float(sensor.temperature)
            humidity_pct = float(sensor.relative_humidity)
            pressure_hpa = float(sensor.pressure)
            next_state = update_indicator(temp_c, indicator_state, HIGH_C, LOW_C)
            led.value = next_state
            indicator_state = next_state
            print("%.1f,%.2f,%.2f,%.2f,%d" % (
                time.monotonic(),
                temp_c,
                humidity_pct,
                pressure_hpa,
                1 if indicator_state else 0,
            ))
            time.sleep(SAMPLE_SECONDS)
        except Exception as error:
            led.value = False
            indicator_state = False
            sensor = None
            print("# ERROR: sensor read failed: %s; clearing indicator and retrying" % error)
            flash_fault(led)


if __name__ == "__main__":
    run()
`,
      "notes/bench-log.csv": `timestamp_s,temp_c,humidity_pct,pressure_hpa,led,sensor_address,observation
`,
    },
  },
  {
    id: "blank",
    title: "Blank engineering project",
    description: "Start from ordinary editable files with an explicit requirements, interfaces, validation, and risk record.",
    category: "general",
    level: "open",
    model: "none",
    skills: ["requirements", "planning", "validation"],
    partIds: [],
    parameters: {},
    files: {
      "README.md": `# New engineering project

Define the intended outcome and evidence before selecting parts or producing geometry. [ENGINEERING.md](ENGINEERING.md) is the working plan and must remain specific to this project as decisions are made.
`,
      "ENGINEERING.md": `# Engineering plan — new project

## Outcome and untested status
The concrete outcome is not yet defined. No design, simulation, source file, assembly, or physical result has been validated.

## Requirements
Write observable success criteria, operating context, constraints, and explicit exclusions. Distinguish measured requirements from preferences.

## Architecture and interfaces
List the major subsystems only after the outcome is defined. For every boundary, record mechanical dimensions, electrical or data contracts, ownership, and the source of truth.

## Real BOM and tool needs
No parts or tools are selected. Add exact items only when a requirement or validation step justifies them; record quantities separately from what is personally owned.

## Staged assembly
1. Define the outcome and acceptance observations.
2. Identify the highest-risk unknown and make the smallest experiment that can resolve it.
3. Record evidence, revise requirements, and select only the parts needed for the next stage.
4. Build in reversible stages, inspecting before adding power or load.

## Validation and expected observations
For each requirement, name a test setup, expected observation, measurement method, and stop condition. A successful software preview is not physical validation.

## Modifications and native-tool handoff
Keep native CAD, firmware, data, and document formats editable. Record which file and tool owns each authoritative dimension or interface.

## Risks, limitations, and unknowns
All technical, safety, compatibility, cost, schedule, and fabrication risks are initially unknown. Replace this statement with concrete risks as the project becomes defined; never convert an unknown into a claim without evidence.
`,
      "notes/decisions.md": `# Decision log

Record date, decision, alternatives considered, evidence, owner, and what would cause the decision to be revisited.
`,
    },
  },
];

export const templates: Template[] = seedDefinitions.map(({ parameters: _parameters, files: _files, ...template }) => template);

export function getTemplateParameters(templateId: string): Record<string, number> {
  const seed = seedDefinitions.find((entry) => entry.id === templateId);
  if (!seed) throw new Error(`Unknown template: ${templateId}`);
  return { ...seed.parameters };
}

export function getTemplateModel(templateId: string): ModelKind {
  const seed = seedDefinitions.find((entry) => entry.id === templateId);
  if (!seed) throw new Error(`Unknown template: ${templateId}`);
  return seed.model;
}

export function getTemplateFiles(templateId: string): Record<string, string> {
  const seed = seedDefinitions.find((entry) => entry.id === templateId);
  if (!seed) throw new Error(`Unknown template: ${templateId}`);
  return {
    ...seed.files,
    ...getLearningFiles(templateId),
    "README.md": `${seed.files["README.md"] ?? ""}\n## Find your way\n\n[Start here](START_HERE.md) · [Engineering plan](ENGINEERING.md) · [Glossary](GLOSSARY.md) · [Learning path](LEARNING_PATH.md)\n`,
    "ENGINEERING.md": addLearningLinks(seed.files["ENGINEERING.md"] ?? ""),
    "AGENTS.md": commonAgentInstructions,
    "CLAUDE.md": claudePointer,
  };
}

export function getTemplatePartIds(templateId: string): string[] {
  const seed = seedDefinitions.find((entry) => entry.id === templateId);
  if (!seed) throw new Error(`Unknown template: ${templateId}`);
  return [...seed.partIds];
}
