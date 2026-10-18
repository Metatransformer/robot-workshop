import type { ReportModel } from "./build-report";
import { sensorLedFirmwareFiles } from "./sensor-led-firmware";

const sections: ReportModel["sections"] = [
  {
    title: "Build status and exact route",
    markdown: `This is a researched, **unbuilt** learning bench. It has not been wired, flashed, measured, calibrated, or physically validated. Use only the original Raspberry Pi Pico RP2040 sold as Adafruit product 4883 and the Adafruit BME280 STEMMA QT breakout sold as product 2652. Do not silently substitute Pico W, Pico 2, BMP280, a bare sensor, or a different breakout.

USB is the only power source. The BME280 is powered from the Pico's 3V3(OUT), and one red 5 mm LED is driven from GP2 through a 1 kΩ series resistor. The LED is a commanded temperature indicator, not a sensor, alarm, calibrated display, or proof of the measured temperature. Physical brightness, sensor accuracy, actual GPIO voltage, and the received components' behavior remain unknown until observed and recorded.`,
  },
  {
    title: "Procurement and receiving inspection",
    markdown: `“Acquire” counts packages; “used” counts parts that enter one build. Check existing supplies first. These links identify exact selections, not current price, stock, shipping, or a purchase recommendation.

| Exact item | Acquire if absent | Used in one build | Receiving check |
| --- | ---: | ---: | --- |
| Original Raspberry Pi Pico RP2040 with loose headers, Adafruit [product 4883](https://www.adafruit.com/product/4883) | 1 board package | 1 Pico and its two included 20-pin strips | Confirm original Pico markings; reject an unintended W or Pico 2 variant. |
| Adafruit BME280 STEMMA QT breakout, [product 2652](https://www.adafruit.com/product/2652) | 1 breakout package | 1 breakout and fitted pad-row header | Confirm BME280 rather than BMP280; inspect the board and supplied loose header. |
| Full-size breadboard, Adafruit [product 239](https://www.adafruit.com/product/239) | 1 | 1 | Confirm the center trench and the actual five-contact strip pattern. |
| Male/male jumper ribbon, Adafruit [product 758](https://www.adafruit.com/product/758) | 1 pack | 6 conductors: 4 sensor, 1 GP2, 1 GND | Both ends must be male; one pack is not one wire. |
| Clear red 5 mm LEDs, Adafruit [product 297](https://www.adafruit.com/product/297) | 1 pack of 25 | 1 LED | Keep the received packaging or datasheet for identity and polarity checks. |
| 1 kΩ ±5%, 1/4 W axial resistors, Adafruit [product 4294](https://www.adafruit.com/product/4294) | 1 pack of 25 | 1 resistor | Confirm markings and measure the isolated part before fitting it. |
| USB-A to Micro-B data cable, [product 592](https://www.adafruit.com/product/592) | Choose 1 for a USB-A host | 1 | Must carry data and power. |
| USB-C to Micro-B data cable, [product 3878](https://www.adafruit.com/product/3878) | Choose instead for a USB-C host | 1 | Replaces the USB-A option; Micro-B is not Mini-B. |
| 0.1-inch 36-pin male header 10-pack, [product 392](https://www.adafruit.com/product/392) | 0 normally; optionally 1 pack if the BME280 header is missing or damaged | One uninterrupted piece matching the received BME280 pad row | Count the actual pads before cutting; this is not a required substitute for the Pico's included headers. |

Required bench tools are a continuity/resistance/DC-voltage multimeter, soldering iron and stand, electronics solder, eye protection, ventilation, and side cutters only if a replacement header must be sized. Work on a clear nonconductive surface. Header soldering and every resistance or continuity check happen with USB disconnected.

Identify the LED from the received part, not from its red color. Adafruit's [LED guide](https://learn.adafruit.com/all-about-leds) describes the flat package edge and shorter lead as cathode clues. Lead length is unreliable after trimming, so inspect the flat edge, verify those clues against the received LED's datasheet or packaging, and stop if polarity remains uncertain. Do not “test” an unknown LED by removing the resistor.`,
  },
  {
    title: "Headers, breadboard, and exact unpowered wiring",
    markdown: `1. Confirm the exact board identities, Pico header strips, BME280 pad count, LED identity, and 1 kΩ resistor before assembly. Measure the **isolated, unpowered** resistor and record its resistance; a nominal ±5% part should fall from 950 Ω to 1050 Ω. Stop on an unexplained result.
2. Fit the Pico headers long-pins-down toward the breadboard, with short ends through the Pico. Keep both strips straight and solder every fitted pad. Fit one continuous BME280 header to its pad row in the same orientation and solder every populated pad. Loose pressed pins are not joints.
3. After cooling, inspect both boards for bridges, missed joints, bent pins, and debris. Straddle the breadboard center trench with the Pico. Put every BME280 pin in a different connected strip. Inspect the actual breadboard pattern; do not assume a power rail or hidden split is continuous.
4. Use the [official numbered Pico pinout](https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf) and the BME280 labels. VIN is used; 3Vo remains disconnected. VBUS physical pin 40 remains disconnected. Wire the four sensor paths and the two LED jumpers exactly as shown.

~~~text
ORIGINAL PICO                         ADAFRUIT BME280
physical 1  GP0  (SDA)  -----------> SDI / SDA
physical 2  GP1  (SCL)  -----------> SCK / SCL
physical 36 3V3(OUT)     -----------> VIN
physical 38 GND          -----------> GND

ORIGINAL PICO                         SERIES INDICATOR PATH
physical 4  GP2 --------> [ 1 kΩ ] -> LED anode (+)
                                           LED cathode (-) -> physical 3 GND
~~~

On the breadboard, use three electrically distinct contact strips for the LED branch: **node A** joins the GP2 jumper to one resistor lead; **node B** joins the other resistor lead to the LED anode; **node C** joins the LED cathode to the GND jumper. The two resistor leads must not share a strip, the two LED leads must not share a strip, and no conductor may bridge around the resistor. This describes electrical nodes, not an invented row or board placement.

Before USB, trace every path endpoint-to-endpoint and verify that adjacent intended nodes are not accidentally continuous. Confirm no short from 3V3(OUT) to GND and no connection to VBUS. Resolve any uncertain pin, polarity, strip, bridge, or measurement before power.`,
  },
  {
    title: "CircuitPython and source handoff",
    markdown: `Install the official original-Pico [CircuitPython UF2](https://circuitpython.org/board/raspberry_pi_pico/): hold BOOTSEL while attaching the USB data cable, copy the correct UF2 to RPI-RP2, and wait for the restart to expose CIRCUITPY. Download the [CircuitPython library bundle](https://circuitpython.org/libraries) whose major version matches the installed CircuitPython major version. Copy the complete **adafruit_bme280**, **adafruit_bus_device**, and **adafruit_register** directories into CIRCUITPY/lib.

Copy **both** source files to the CIRCUITPY root: copy firmware/code.py as **code.py** and firmware/indicator.py as **indicator.py**. Do not merge them or leave indicator.py inside a firmware directory on the device. The packet's source files own the behavior; do not retype fragments from the printed guide.

In Metatransformer choose New project → Pico + BME280 external LED indicator to obtain the source packet. Keep README.md, BUY_AND_BUILD.md, WIRING.md, ENGINEERING.md, firmware/behavior.md, both Python files, and both notes CSV files together. Use Export source after reviewing notes for private information. A recipient can import the bundle with \`pnpm workshop import /path/to/build.workshop.json /path/to/new-build\`, then register it with \`pnpm workshop register /path/to/new-build\`. Use a new destination directory. Recheck the received hardware and wiring after transfer; source portability is not physical validation.`,
  },
  {
    title: "Firmware contract",
    markdown: `GP2 is configured as an active-high output with its first commanded value false. Before any sensor initialization, firmware commands exactly three startup pulses: 0.2 seconds on followed by 0.2 seconds off, repeated three times, then leaves the LED off. These pulses test only the commanded output path; they do not prove that light was emitted.

After initialization, temperature at or above 28 °C commands the LED on, temperature at or below 26 °C commands it off, and a finite temperature strictly between those thresholds retains the prior state. Once per second, a successful sample prints \`timestamp,temp_c,humidity_pct,pressure_hpa,led\`. The final field is the commanded GP2 state, not an optical measurement.

The scan accepts exactly one supported BME280 address, 0x76 or 0x77, unless ADDRESS explicitly selects a detected supported address. No supported address, both addresses without an explicit selection, initialization failure, read failure, or any non-finite temperature, humidity, or pressure value clears the LED off, clears hysteresis state, prints a comment-prefixed error, and retries after one second. Faults never blink the LED; the three boot pulses are intentionally unique. Recovery begins from an off state.`,
  },
  {
    title: "Staged acceptance and measurement",
    markdown: `1. **Unpowered identity and path check:** identify both boards, the LED polarity, and the resistor; measure the isolated resistor; inspect solder; trace all four sensor paths and the complete GP2–resistor–LED–GND path. Expected: the documented endpoints and no resistor bypass. Record facts, not expected values as observations.
2. **Startup indication:** with intact wiring, connect USB and watch one boot. Expected command: three 0.2-second on/off pulses before sensor initialization, ending off. Imports run before the startup pulses: if no light is observed, first inspect the USB serial traceback for missing files or libraries. Do **not** bypass the resistor. Disconnect USB and inspect firmware placement, GP2/GND endpoints, breadboard nodes, LED identity and polarity, and joints.
3. **Sensor and CSV:** open the serial console. Expected: a startup comment, one detected 0x76 or 0x77 address, one CSV header, and finite five-field rows roughly once per second. Record the address and actual rows. Plausible output is not calibration evidence.
4. **Controlled threshold check:** read a stable ambient value T from CSV. Edit **HIGH_C and LOW_C near the top of CIRCUITPY/code.py**, not the defaults in indicator.py. For forced ON, use HIGH_C = T − 1 and LOW_C = T − 2; for forced OFF, use HIGH_C = T + 2 and LOW_C = T + 1. Substitute actual numbers: at T = 23, ON uses 22/21 and OFF uses 25/24. Save each configuration and wait through the three startup pulses for normal CSV, then record commanded and observed light. Saving restarts CircuitPython and resets state: these checks demonstrate ON/OFF, not retained-state memory. Retention requires crossing a threshold and returning into the gap during one uninterrupted run; if ordinary ambient changes cannot do this, record that bench check as pending (the pure Python tests cover the rule). Do not use hazardous heating. Restore **HIGH_C = 28.0** and **LOW_C = 26.0** in code.py afterward.
5. **Electrical observation:** with the series circuit intact and LED commanded on, measure DC voltage **across the resistor** using a high-impedance voltage input. Infer current from measured \`I = V_R / R_measured\`; record voltage, measured resistance, and calculated current. Do not place an ammeter across GP2 and GND or across the LED—an ammeter is not a high-impedance voltage probe.
6. **Fault and recovery:** disconnect USB before removing the BME280 wires. Reconnect USB with the sensor absent. Expected: the three startup pulses occur once, then the output stays off while comment-prefixed initialization errors retry about once per second; there is no fault blink. Disconnect USB again, restore all four sensor wires, inspect, and reboot. Expected: three startup pulses, sensor detection, and CSV rows resume without editing firmware.

Disconnect immediately for heat, odor, smoke, instability, a suspected power/ground crossing, or damaged insulation. Do not rewire or use resistance/continuity mode while powered.`,
  },
  {
    title: "Engineering calculation and learning check",
    markdown: `The LED seller publishes a 1.8–2.2 V forward-voltage range **at 20 mA**. That range is not specified at this bench's roughly 1 mA operating point, so 2.0 V is an explicit modeling assumption rather than a measured fact. With an assumed 3.3 V output, 2.0 V LED drop, and 1000 Ω resistance:

~~~text
I = (3.3 V - 2.0 V) / 1000 Ω = 0.0013 A = 1.3 mA
P_resistor = I²R = (0.0013 A)² × 1000 Ω = 0.00169 W = 1.69 mW
~~~

Learning check—before reading the next paragraph, answer: **What is the nominal modeled LED current, and why does the forward-voltage assumption matter?** Review [Ohm's law](/learn?lesson=voltage-current-resistance) and [digital interfaces](/learn?lesson=digital-interfaces) if helpful.

Answer: the nominal modeled current is **1.3 mA**. The assumed LED drop determines how much of the output voltage remains across the resistor, and the published 1.8–2.2 V range applies at 20 mA rather than guaranteeing the drop at this lower current. Therefore neither exact current nor brightness is established by the nominal calculation.

At the resistor's −5% tolerance limit, R is 950 Ω. Even the deliberately unrealistic calculation V_LED = 0 V with an assumed 3.3 V output gives 3.47 mA and about 11.5 mW in the resistor **if the resistor remains in series**. This is a bounded resistor calculation, not short-circuit protection, a per-pin allowance, or a safety claim if the resistor is bypassed.

The RP2040 datasheet §5.5.3/Table 625 specifies a minimum high output voltage of 2.62 V at 3.3 V IOVDD under its listed configured 2/4/8/12 mA drive test conditions. Drive strength is not a current regulator. The datasheet's 50 mA aggregate GPIO/QSPI source-or-sink figure is a combined constraint, not permission to draw 50 mA from one pin. This bench uses the resistor and requires measurement rather than treating a nominal “3.3 V GPIO” label as an exact source.`,
  },
  {
    title: "Records, limits, and troubleshooting",
    markdown: `Use notes/bench-log.csv for timestamped sensor observations with its unchanged schema. Use notes/led-bench-log.csv for the date, exact received LED and resistor, measured resistance, startup-pulse observation, commanded LED value, separately observed light, resistor voltage, inferred current, and notes. Keep commanded state and observed light separate: firmware can report \`led=1\` even if the LED is reversed, misplaced, damaged, or not visibly bright.

If RPI-RP2 never appears, check the data cable and BOOTSEL procedure. If CIRCUITPY appears but imports fail, check the matching library-bundle major version, all three required library directories under lib, and both project Python files at the CIRCUITPY root. If no startup marker appears, inspect the serial traceback: imports must succeed before the pulse test can run. If startup commands are reported but no light is seen, power down and inspect polarity, distinct breadboard strips, the resistor path, and GP2/GND. If sensor initialization fails, power down and inspect the four sensor endpoints, solder, and exact BME280 identity. If CSV resumes but readings seem high, investigate Pico/USB heat, airflow, placement, settling time, and comparison evidence before applying any correction.

Unresolved physical evidence includes actual GPIO and resistor voltage, current, visible brightness, LED forward drop at this current, sensor address, sample timing tolerance, sensor offset, repeatability, self-heating, airflow response, altitude interpretation, humidity accuracy, and solder/jumper reliability. The design is an approachable lab interface, not a calibrated environmental instrument or certified indicator.`,
  },
];

const sources: ReportModel["sources"] = [
  { title: "Adafruit — original Raspberry Pi Pico RP2040 with loose headers", url: "https://www.adafruit.com/product/4883" },
  { title: "Adafruit — original Pico numbered pinout", url: "https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf" },
  { title: "Raspberry Pi — RP2040 datasheet", url: "https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf" },
  { title: "Adafruit — BME280 STEMMA QT breakout", url: "https://www.adafruit.com/product/2652" },
  { title: "Adafruit — BME280 power and signal pinouts", url: "https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/pinouts" },
  { title: "Adafruit — red 5 mm LED 25-pack", url: "https://www.adafruit.com/product/297" },
  { title: "Adafruit — All About LEDs polarity guide", url: "https://learn.adafruit.com/all-about-leds" },
  { title: "Adafruit — 1 kΩ ±5% 1/4 W resistor 25-pack", url: "https://www.adafruit.com/product/4294" },
  { title: "Adafruit — full-size breadboard", url: "https://www.adafruit.com/product/239" },
  { title: "Adafruit — male/male jumper ribbon", url: "https://www.adafruit.com/product/758" },
  { title: "Adafruit — USB-A to Micro-B data cable", url: "https://www.adafruit.com/product/592" },
  { title: "Adafruit — USB-C to Micro-B data cable", url: "https://www.adafruit.com/product/3878" },
  { title: "Adafruit — backup 0.1-inch male header", url: "https://www.adafruit.com/product/392" },
  { title: "Adafruit — BME280 header assembly", url: "https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/assembly" },
  { title: "CircuitPython — original Raspberry Pi Pico UF2", url: "https://circuitpython.org/board/raspberry_pi_pico/" },
  { title: "CircuitPython — library bundles", url: "https://circuitpython.org/libraries" },
];

export const sensorLedGuide: ReportModel = {
  title: "Buy and build — Pico + BME280 external LED indicator",
  subtitle: "Standalone procurement, wiring, firmware, measurement, and evidence handoff · researched but unbuilt",
  sections,
  sources,
};

const guideMarkdown = [
  `# ${sensorLedGuide.title}`,
  sensorLedGuide.subtitle,
  ...sensorLedGuide.sections.flatMap((section) => [`## ${section.title}`, section.markdown]),
  "## Sources",
  sensorLedGuide.sources.map((source) => `- [${source.title}](${source.url})`).join("\n"),
].filter((entry): entry is string => Boolean(entry)).join("\n\n");

const readme = `# Pico + BME280 external LED indicator

Build a USB-powered environmental logger with an external red LED on GP2. Temperature at or above 28 °C commands the LED on; temperature at or below 26 °C commands it off; between those limits it retains its prior state. Three short startup pulses occur before sensor initialization. Serial output logs temperature, humidity, pressure, and the **commanded** LED state once per second.

Status: researched and coded, but not physically assembled, flashed, measured, calibrated, or validated. Visible brightness and sensor accuracy are unknown.

## Start here

1. Read [ENGINEERING.md](ENGINEERING.md) for requirements, interfaces, calculations, unknowns, and acceptance stages.
2. Acquire and identify the exact parts in [BUY_AND_BUILD.md](BUY_AND_BUILD.md).
3. With USB disconnected, solder headers and make all six connections in [WIRING.md](WIRING.md).
4. Install original-Pico CircuitPython and the matching library bundle as described in WIRING.md.
5. Copy **firmware/code.py** to CIRCUITPY as **code.py** and **firmware/indicator.py** to CIRCUITPY as **indicator.py**.
6. Read [firmware/behavior.md](firmware/behavior.md), then run the staged startup, CSV, threshold, measurement, fault, and recovery checks.
7. Record sensor rows in [notes/bench-log.csv](notes/bench-log.csv) and keep commanded-versus-observed LED evidence in [notes/led-bench-log.csv](notes/led-bench-log.csv).

Do not use the original sensor starter's onboard-LED wiring directions for this build. This packet is the complete authority for the external-LED route.
`;

const engineering = `# Engineering plan — Pico + BME280 external LED indicator

## Outcome and untested status

An original Raspberry Pi Pico RP2040 shall read one Adafruit BME280 over I2C, report finite temperature, humidity, and pressure values over USB serial once per second, and command a red external LED through a 1 kΩ series resistor on GP2. This packet is complete source and documentation, but no physical result has been observed. It makes no calibration, brightness, reliability, or safety certification claim.

## Requirements

- USB is the only power input. Pico physical pin 36, 3V3(OUT), powers BME280 VIN; VBUS physical pin 40 and BME280 3Vo remain disconnected.
- I2C0 uses GP0 physical pin 1 for SDI/SDA and GP1 physical pin 2 for SCK/SCL, with Pico GND physical pin 38 connected to BME280 GND.
- GP2 physical pin 4 shall drive a red LED anode only through one 1 kΩ ±5%, 1/4 W resistor. The LED cathode returns through a separate jumper to GND physical pin 3.
- Firmware shall command GP2 false first, then exactly three 0.2-second on/0.2-second off startup pulses before sensor initialization, ending off.
- The normal state is on at or above 28 °C, off at or below 26 °C, and retained strictly between. The serial schema is timestamp,temp_c,humidity_pct,pressure_hpa,led, where led is a command rather than a light measurement.
- Exactly one detected 0x76 or 0x77 sensor is selected automatically; no supported address or both addresses is a fault unless ADDRESS explicitly selects one detected supported address.
- Every initialization, address, read, or non-finite-value fault shall command off, reset hysteresis to off, print a comment-prefixed error, and retry after one second. Only boot uses pulses; faults do not blink.
- Source remains editable as ordinary CircuitPython files. Third-party libraries come from the matching official bundle and are not vendored here.

## Architecture and interfaces

| Boundary | Source | Destination | Contract | Evidence state |
| --- | --- | --- | --- | --- |
| Host power/data | Host USB | Pico Micro-B | USB power, CIRCUITPY storage, serial | Cable and enumeration pending |
| Sensor power | Pico 3V3(OUT), physical 36 | BME280 VIN | 3.3 V nominal | Actual voltage pending |
| Sensor return | Pico GND, physical 38 | BME280 GND | Common return | Continuity pending |
| I2C data | Pico GP0, physical 1 | BME280 SDI/SDA | I2C0 SDA | Detection pending |
| I2C clock | Pico GP1, physical 2 | BME280 SCK/SCL | I2C0 SCL | Detection pending |
| Indicator source | Pico GP2, physical 4 | 1 kΩ resistor, then LED anode | Active-high command; resistor always in series | Voltage/current/light pending |
| Indicator return | LED cathode | Pico GND, physical 3 | Dedicated jumper to common return | Polarity/continuity pending |
| Sensor identity | I2C scan | BME280 driver | One of 0x76/0x77 or explicit detected selection | Address pending |

## LED model and learning check

The product page gives 1.8–2.2 V at 20 mA, not at this approximately 1 mA operating point. Assuming 3.3 V output, 2.0 V LED drop, and 1000 Ω gives I = (3.3 − 2.0)/1000 = **1.3 mA** and resistor power I²R = **1.69 mW**. Before using those numbers, answer: why does the forward-voltage assumption matter? Answer: it changes the resistor's voltage and therefore modeled current, while the published range does not guarantee the drop at our lower current. Exact current and brightness remain measurements.

At −5% tolerance R_min = 950 Ω. With the resistor still in series, an assumed 3.3 V across it would model 3.47 mA and 11.5 mW. That bound is not protection against bypassing the resistor or shorting the pin. The RP2040 high-level specification is load-dependent; configured drive strength is not a current regulator, and the 50 mA GPIO/QSPI figure is aggregate rather than a one-pin allowance. See [Ohm's law](/learn?lesson=voltage-current-resistance) and [digital interfaces](/learn?lesson=digital-interfaces).

## Staged validation

1. Unpowered: identify exact parts and polarity, measure the isolated resistor, inspect joints, trace four sensor paths plus the complete series LED path, and rule out a resistor bypass.
2. Boot: observe whether three startup pulses occur and end off. If not, disconnect USB and inspect; never bypass the resistor.
3. Sensor: capture the address, header, and finite five-field CSV rows at roughly one-second intervals.
4. Threshold: follow the explicit ambient-relative HIGH_C/LOW_C edits in BUY_AND_BUILD.md. Forced ON/OFF edits restart the program and do not prove state retention. Record retention as pending unless observed in one uninterrupted run; restore HIGH_C = 28.0 and LOW_C = 26.0.
5. Measurement: with the LED commanded on, measure DC voltage across the resistor with a high-impedance voltage input and infer I = V_R/R_measured. Never place an ammeter across GP2 and GND.
6. Fault/recovery: unplug USB, remove BME280 wiring, repower, observe one startup sequence followed by off/error/retry without blinking, then unplug, restore wiring, inspect, and reboot to healthy CSV output.

## Unknowns and records

Sensor calibration, local heating, airflow, actual address, sample timing, output voltage, LED forward drop, current, brightness, solder quality, and jumper reliability are unverified. notes/bench-log.csv retains the established sensor-observation schema. notes/led-bench-log.csv separately records commanded state and observed light so software telemetry is never misrepresented as physical evidence. WIRING.md owns endpoints; firmware/code.py and firmware/indicator.py own behavior.
`;

const wiring = `# Wiring and CircuitPython setup

## Exact hardware and unpowered preparation

This route uses the original Raspberry Pi Pico RP2040 (Adafruit 4883) and Adafruit BME280 STEMMA QT breakout (2652), not look-alike variants. USB must be disconnected for soldering, resistance/continuity checks, and every wiring change. Fit and solder the Pico's two included headers and the BME280's continuous pad-row header as described in BUY_AND_BUILD.md. Inspect every joint and the actual breadboard strip pattern.

Identify the red LED cathode from the received component documentation plus the flat package edge/short-lead clues. Lead length is not reliable after trimming. Measure the isolated 1 kΩ ±5% resistor before installation and record the result.

## Six jumper connections and series components

| Pico endpoint | Physical pin | Destination | Purpose |
| --- | ---: | --- | --- |
| GP0 | 1 | BME280 SDI/SDA | I2C data |
| GP1 | 2 | BME280 SCK/SCL | I2C clock |
| 3V3(OUT) | 36 | BME280 VIN | Sensor power |
| GND | 38 | BME280 GND | Sensor common return |
| GP2 | 4 | One end of 1 kΩ resistor; other end to LED anode | Active-high indicator command |
| GND | 3 | LED cathode | Indicator return |

~~~text
Pico 1  GP0  ------------------------------ BME280 SDI/SDA
Pico 2  GP1  ------------------------------ BME280 SCK/SCL
Pico 36 3V3(OUT) -------------------------- BME280 VIN
Pico 38 GND ------------------------------- BME280 GND

Pico 4 GP2 -- jumper -- [1 kΩ] -- LED anode (+)
                                      LED cathode (-) -- jumper -- Pico 3 GND
~~~

Use three distinct breadboard contact strips: GP2 jumper plus resistor end; other resistor end plus LED anode; LED cathode plus GND jumper. The resistor ends cannot share a strip, the LED legs cannot share a strip, and no jumper can bypass the resistor. VIN is not 3Vo. Leave 3Vo and VBUS physical pin 40 disconnected. Use no external supply and avoid breadboard power rails.

Before power, trace all six jumper paths and the two series components, check LED polarity, and screen for an unintended 3V3(OUT)-to-GND short. Stop on ambiguity.

## CircuitPython installation

1. Download the official UF2 for the original Raspberry Pi Pico from the [CircuitPython board page](https://circuitpython.org/board/raspberry_pi_pico/).
2. Hold BOOTSEL while connecting USB, release when RPI-RP2 appears, copy the UF2, and wait for CIRCUITPY.
3. Download the library bundle whose major version matches CircuitPython. Copy the complete adafruit_bme280, adafruit_bus_device, and adafruit_register directories into CIRCUITPY/lib.
4. Copy this packet's firmware/code.py to CIRCUITPY/code.py and firmware/indicator.py to CIRCUITPY/indicator.py.
5. Open a CircuitPython serial console. Do not edit wiring while USB is connected.

Healthy serial output begins with comment-prefixed startup/address information, then one header and rows shaped like this; numbers and address will differ:

~~~text
# STARTUP: commanding three GP2 LED pulses; command only, not a light measurement
# BME280 ready at 0x77
timestamp,temp_c,humidity_pct,pressure_hpa,led
12.3,23.41,38.22,831.54,0
~~~

The led field reports the GP2 command, never observed light.
`;

const firmwareBehavior = `# Firmware behavior

## Startup

firmware/code.py configures GP2 with \`switch_to_output(value=False)\`. It then commands three 0.2-second on/0.2-second off pulses before attempting to initialize the BME280 and explicitly leaves GP2 false afterward. The startup sequence runs once per program start. It is not a fault code and is not proof of physical light.

## Sensor selection and logging

The I2C bus uses SCL GP1 and SDA GP0. Automatic selection accepts exactly one detected address from 0x76 and 0x77. If both supported addresses exist, ADDRESS must explicitly name the intended detected sensor; if neither exists, initialization fails rather than guessing.

Each successful sample converts temperature, relative humidity, and pressure to finite numbers. Once per second it prints:

    timestamp,temp_c,humidity_pct,pressure_hpa,led

timestamp is seconds since runtime startup. led is 0 or 1 for the commanded GP2 state, not an optical reading.

## Hysteresis

firmware/indicator.py owns the pure decision rule. At temperature >= 28 °C it returns on; at temperature <= 26 °C it returns off; strictly between, it returns the prior state. Thresholds and readings must be finite and LOW_C must be less than HIGH_C. This separation prevents rapid state chatter near one threshold but does not validate temperature accuracy.

## Faults and recovery

An absent or ambiguous address, initialization error, read error, or non-finite temperature, humidity, or pressure commands GP2 off, resets remembered state to off, prints a comment-prefixed error, and retries after one second. Fault handling never pulses or blinks. After recovery, hysteresis therefore starts off. Keep the startup pulses unique so a disconnected sensor cannot resemble a working threshold indication.

Use ordinary ambient conditions for threshold tests and restore HIGH_C = 28.0 and LOW_C = 26.0 afterward. Record commanded and visually observed LED states separately. Firmware behavior is tested source behavior, not hardware validation or calibration.
`;

const benchLog = "timestamp_s,temp_c,humidity_pct,pressure_hpa,led,sensor_address,observation\n";
const ledBenchLog = "date,exact_led,exact_resistor,measured_resistance_ohm,startup_pulses_observed,commanded_led,observed_light,resistor_voltage_v,inferred_current_ma,notes\n";

export const sensorLedFiles: Record<string, string> = {
  "README.md": readme,
  "ENGINEERING.md": engineering,
  "WIRING.md": wiring,
  "BUY_AND_BUILD.md": guideMarkdown,
  "firmware/behavior.md": firmwareBehavior,
  "notes/bench-log.csv": benchLog,
  "notes/led-bench-log.csv": ledBenchLog,
  ...sensorLedFirmwareFiles,
};
