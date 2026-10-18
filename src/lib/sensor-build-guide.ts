import type { ReportModel } from "./build-report";

const sections: ReportModel["sections"] = [
  {
    title: "Build status and exact route",
    markdown: `This is a researched assembly plan, not a completed build or electrical qualification. It keeps the existing firmware and four-wire mapping unchanged. Use the **original Raspberry Pi Pico (RP2040)**, not Pico W, Pico 2, or a similar-looking board, with the **Adafruit BME280 STEMMA QT breakout**. A bare Bosch sensor or BMP280 is not equivalent.

This breadboard route requires soldered male headers. The Pico package includes two separate loose, unsoldered 20-pin strips (40 Pico pins total), so extra Pico headers are normally unnecessary. Inspect the BME280, confirm its populated pad-row count, and fit its loose continuous header. The route uses labelled pads, not STEMMA QT connectors, so no QT cable is required.`,
  },
  {
    title: "Required companion files and sharing",
    markdown: `This is a procurement and assembly supplement, not a self-contained firmware packet. Before assembling, open Metatransformer, choose New project, and select the Pico + BME280 temperature indicator starter. The web guide has an Open starter action; a printed copy alone does not contain the program.

Keep BUY_AND_BUILD.md, WIRING.md, ENGINEERING.md, firmware/code.py, firmware/behavior.md, and notes/bench-log.csv together. In the project's Export source dialog, include these files in the portable source bundle. Review any edited files for private information before sharing the bundle alongside this PDF. A recipient with Metatransformer can import it with the CLI: pnpm workshop import /path/to/build.workshop.json /path/to/new-build, then pnpm workshop register /path/to/new-build. Choose a new output directory; imported source preserves the actual program and instructions.

An existing sensor project can use this web supplement without having its files changed. Its own wiring and firmware remain authoritative if the owner has modified them; reconcile those changes before using this original-starter shopping list.`,
  },
  {
    title: "Procurement checklist",
    markdown: `“Acquire” counts packages; “used” counts what enters one build. Check existing supplies first. Links identify parts, not price, stock, delivery, or a purchase.

| Item and exact choice | Acquire if absent | Used in one build | Selection check |
| --- | ---: | ---: | --- |
| Original Pico RP2040, Adafruit [product 4883](https://www.adafruit.com/product/4883); Raspberry Pi vendor | 1 board package | 1 board and two included 20-pin strips | Verify original Pico markings and loose unsoldered headers. |
| Adafruit BME280 STEMMA QT breakout, [product 2652](https://www.adafruit.com/product/2652) | 1 breakout package | 1 breakout and fitted pad-row header | Confirm BME280; inspect the PCB and included loose header. |
| Full-size 830-point breadboard, [product 239](https://www.adafruit.com/product/239) | 1 | 1 | Confirm a central trench and enough separate accessible 0.1-inch rows. |
| 40-wire, 150 mm male/male jumper ribbon, [product 758](https://www.adafruit.com/product/758) | 1 pack | 4 individual wires | Separate four conductors. Both ends must be male. |
| USB-A to Micro-B data cable, 3 ft ([product 592](https://www.adafruit.com/product/592)) | Choose 1 if the host has USB-A | 1 | Must carry data as well as power. |
| USB-C to Micro-B data cable, 1 m ([product 3878](https://www.adafruit.com/product/3878)) | Choose instead if the host has USB-C | 1 | This replaces, rather than adds to, the USB-A cable. Micro-B is not Mini-B. |
| 0.1-inch 36-pin male header 10-pack, [product 392](https://www.adafruit.com/product/392) | 0 normally; optionally 1 pack if supplied header is missing/damaged | One uninterrupted piece matching the BME pad row | Count fitted pins, not “one packet”; this is not a mandatory Pico-header substitute. |

If a listing is unavailable, use the Raspberry Pi retailer links or another supplier offering the same original board and connector specifications; confirm header population before ordering. Do not silently substitute Pico W, Pico 2, or BMP280. One jumper pack is not one wire. A charge-only phone lead may power the board but cannot expose RPI-RP2, load firmware, or provide serial. No external battery, motor, supply, LED, resistor, or QT cable is needed.`,
  },
  {
    title: "Workspace, tools, and consumables",
    markdown: `Required: host computer, verified USB data cable, soldering iron and stand, electronics solder, eye protection, and ventilation. Use side cutters only to fit a header to the received pad count. A continuity/DC-voltage multimeter is recommended.

Work on a clear nonconductive bench with USB disconnected during header fitting and wiring. Never measure resistance/continuity on a powered circuit or measure mains. If variant identification or soldering is unfamiliar, get knowledgeable help or correctly preassembled boards.`,
  },
  {
    title: "Unpowered header and breadboard assembly",
    markdown: `1. Confirm original Pico markings, Adafruit BME280 identity, two separate 20-pin Pico header strips, and the BME header. Stop on a variant or pad-count mismatch.
2. Fit the Pico headers with long pins down toward the breadboard and short ends through the Pico. Keep them straight and seated; solder every fitted pad. Pressed loose pins are not electrical joints.
3. Confirm the BME280 pad-row count. Fit its continuous header long-pins-down and solder every populated pad. Use the linked Adafruit assembly instructions for solder technique.
4. Cool and inspect the unpowered boards for missed joints, bridges, bent pins, and debris. Correct any bridge, especially at power or ground.
5. Straddle the breadboard’s central trench with the Pico. A typical numbered row connects five contacts on one side; the gap isolates the opposite five. Inspect the actual layout and use unpowered continuity if uncertain.
6. Put each BME pin in a different connected row, leaving a contact for its jumper. Putting all pins in one five-contact strip shorts them together.
7. Identify the numbered pins with the [original Pico pinout](https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf) and match sensor labels with the [BME280 pinout](https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/pinouts). VIN is the input used here; 3Vo is a different output pin and stays disconnected. Do not guess orientation from wire color. Avoid power rails. Insert four direct male jumpers into rows shared with the intended header pins: **GP0 physical pin 1 to SDI/SDA**, **GP1 physical pin 2 to SCK/SCL**, **3V3(OUT) physical pin 36 to VIN**, and **GND physical pin 38 to GND**. Do not connect VBUS physical pin 40. Labels and pin numbers, not colors, control.`,
  },
  {
    title: "Preflight before and after first power",
    markdown: `Before USB, trace all four paths against WIRING.md. Check for bridges, crossed power, wrong five-contact rows, or rail use. Unpowered continuity may confirm paths and screen for a 3V3(OUT)-to-GND short. Resolve ambiguity before power.

First power is USB only. After inspection, connect the data cable without touching conductors. DC-voltage mode may check 3V3(OUT) relative to GND; record the reading, not an invented result. Disconnect immediately for heat, odor, smoke, instability, or suspected crossed power. An absence of symptoms does not establish correct wiring or component ratings.`,
  },
  {
    title: "Software handoff",
    markdown: `WIRING.md owns endpoints; firmware/code.py owns behavior. Hold BOOTSEL while attaching USB and verify **RPI-RP2**. Install the original Pico CircuitPython UF2 and verify **CIRCUITPY** after restart. Match the library bundle’s major version to CircuitPython, copy the BME280 package and dependencies named in WIRING.md, then copy firmware/code.py to CIRCUITPY as code.py.

Open serial. The firmware already handles 0x76/0x77; do not alter wiring or force an address because either appears. Save the detected-address line, CSV header, rows, and errors. Nearby Pico/USB heat can raise readings, so observe placement and warm-up before treating temperature as ambient.`,
  },
  {
    title: "Capture and inspect observations",
    markdown: `Open Inspect sensor readings from the sensor project's Overview or the web build guide. In your serial editor, copy the firmware's CSV header and subsequent output into Serial CSV, or save that text as a CSV/TXT file and import it. Keep comment lines beginning with #, including sensor faults; the inspector retains these diagnostics and separates interrupted recordings. This is a manual text handoff, not a live USB connection.

The supported header is timestamp,temp_c,humidity_pct,pressure_hpa,led. The separate notes/bench-log.csv worksheet has extra columns and is not this serial format. Timestamps are seconds since firmware startup, not calendar times. Inspect each recording segment, compare temperature, humidity and pressure, and record placement, expected versus observed behavior, interruptions and uncertainty in Bench observations. Logged LED states are commanded outputs, not independent confirmation that an LED lit.

Download an observation report to preserve the selected segment, notes, source line numbers and diagnostics; download readings CSV for further analysis. Notes live in the current browser tab until exported. A synthetic example is available for practicing the workflow before hardware arrives. Imported readings remain user-supplied and unverified: a plot alone establishes neither calibration nor successful construction.`,
  },
  {
    title: "Diagnostic decision table",
    markdown: `| Observation | Most likely layer to check next | Safe next action |
| --- | --- | --- |
| No RPI-RP2 drive while BOOTSEL is held | USB data path or BOOTSEL timing | Disconnect, verify the cable is data-capable and the host port works, then repeat the BOOTSEL connection. Do not rewire the sensor while powered. |
| RPI-RP2 appears, but CIRCUITPY never appears | CircuitPython UF2 installation | Confirm the downloaded UF2 is for the original Pico, copy it to RPI-RP2, and wait for the restart. |
| CIRCUITPY mounts, but serial reports ImportError | Library bundle or file placement | Match the bundle’s major version to CircuitPython and restore the BME280 package plus documented dependencies under CIRCUITPY/lib. |
| Firmware reports no BME280 at 0x76 or 0x77 | Power, ground, SDA/SCL rows, solder joints, or board identity | Disconnect USB. Recheck the four exact endpoints, row topology, joints, and BME280 marking before repowering. |
| Address and CSV output are present, but temperature seems consistently high | Local heating or placement bias | Move the breakout away from Pico/USB heat where the wiring remains secure, allow conditions to settle, and compare recorded observations. Do not claim a correction without reference evidence. |
| Board, cable, or joint becomes unexpectedly hot | Power fault or short | Disconnect USB immediately and keep it unpowered until crossed power, bridges, debris, and component damage are resolved. |`,
  },
];

const sources: ReportModel["sources"] = [
  { title: "Original Pico numbered pinout", url: "https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf" },
  { title: "Adafruit — BME280 power and signal pinouts", url: "https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/pinouts" },
  { title: "Adafruit — Raspberry Pi Pico with loose headers", url: "https://www.adafruit.com/product/4883" },
  { title: "Adafruit — BME280 STEMMA QT breakout", url: "https://www.adafruit.com/product/2652" },
  { title: "Adafruit — full-size 830-point breadboard", url: "https://www.adafruit.com/product/239" },
  { title: "Adafruit — male/male jumper ribbon", url: "https://www.adafruit.com/product/758" },
  { title: "Adafruit — USB-A to Micro-B data cable", url: "https://www.adafruit.com/product/592" },
  { title: "Adafruit — USB-C to Micro-B data cable", url: "https://www.adafruit.com/product/3878" },
  { title: "Adafruit — backup 0.1-inch male header", url: "https://www.adafruit.com/product/392" },
  { title: "Adafruit — BME280 header assembly", url: "https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/assembly" },
  { title: "Raspberry Pi — Pico product and variant reference", url: "https://www.raspberrypi.com/products/raspberry-pi-pico/" },
  { title: "CircuitPython — original Raspberry Pi Pico UF2", url: "https://circuitpython.org/board/raspberry_pi_pico/" },
  { title: "CircuitPython — library bundles", url: "https://circuitpython.org/libraries" },
  { title: "Adafruit — BME280 CircuitPython wiring and library guide", url: "https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/python-circuitpython-test" },
];

export const sensorBuildGuide: ReportModel = {
  title: "Buy and build — Pico + BME280 temperature indicator",
  subtitle: "Procurement and assembly handoff · researched but not physically built or electrically qualified",
  sections,
  sources,
};

export const sensorBuildGuideMarkdown = [
  `# ${sensorBuildGuide.title}`,
  sensorBuildGuide.subtitle,
  ...sensorBuildGuide.sections.flatMap((section) => [`## ${section.title}`, section.markdown]),
  "## Sources",
  sensorBuildGuide.sources.map((entry) => `- [${entry.title}](${entry.url})`).join("\n"),
].filter((entry): entry is string => Boolean(entry)).join("\n\n");
