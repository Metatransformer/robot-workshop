type LearningTemplate = "linkage" | "desk-robot" | "cyberdeck" | "sensor" | "blank";

type GlossaryTerm = {
  label: string;
  anchor: string;
  patterns: RegExp[];
};

const templateNames: Record<LearningTemplate, string> = {
  linkage: "Four-bar linkage",
  "desk-robot": "One-servo desk creature",
  cyberdeck: "Personal computer build",
  sensor: "Pico + BME280 temperature indicator",
  blank: "Your own engineering project",
};

const glossaryTerms: GlossaryTerm[] = [
  { label: "BOM", anchor: "bom", patterns: [/\bBOM\b/i, /\bbill of materials\b/i] },
  { label: "firmware", anchor: "firmware", patterns: [/\bfirmware\b/i] },
  { label: "GPIO", anchor: "gpio", patterns: [/\bGPIO\b/i] },
  { label: "I2C", anchor: "i2c", patterns: [/\bI2C\b/i] },
  { label: "voltage", anchor: "voltage", patterns: [/\bvoltage\b/i] },
  { label: "current", anchor: "current", patterns: [/\bcurrent\b/i] },
  { label: "ground", anchor: "ground", patterns: [/\bgrounds?\b/i] },
  { label: "polarity", anchor: "polarity", patterns: [/\bpolarity\b/i] },
  { label: "pinout", anchor: "pinout", patterns: [/\bpinouts?\b/i] },
  { label: "power budget", anchor: "power-budget", patterns: [/\bpower budgets?\b/i] },
  { label: "hysteresis", anchor: "hysteresis", patterns: [/\bhysteresis\b/i] },
  { label: "calibration", anchor: "calibration", patterns: [/\bcalibrat(?:e|ed|es|ing|ion)\b/i] },
  { label: "tolerance", anchor: "tolerance", patterns: [/\btolerances?\b/i] },
  { label: "CAD", anchor: "cad", patterns: [/\bCAD\b/i] },
  { label: "mesh", anchor: "mesh", patterns: [/\bmeshes?\b/i] },
  { label: "degrees of freedom", anchor: "degrees-of-freedom", patterns: [/\bdegrees? of freedom\b/i] },
  { label: "kinematics", anchor: "kinematics", patterns: [/\bkinematics?\b/i] },
  { label: "crank", anchor: "crank", patterns: [/\bcranks?\b/i] },
  { label: "coupler", anchor: "coupler", patterns: [/\bcouplers?\b/i] },
  { label: "rocker", anchor: "rocker", patterns: [/\brockers?\b/i] },
  { label: "torque", anchor: "torque", patterns: [/\btorque\b/i] },
  { label: "stall", anchor: "stall", patterns: [/\bstall(?:s|ed|ing)?\b/i] },
  { label: "thermal throttling", anchor: "thermal-throttling", patterns: [/\bthermal throttling\b/i, /\bthrottling\b/i] },
  { label: "strain relief", anchor: "strain-relief", patterns: [/\bstrain relief\b/i] },
  { label: "logic level", anchor: "logic-level", patterns: [/\blogic levels?\b/i] },
  { label: "source claim", anchor: "source-claim", patterns: [/\bsource claims?\b/i] },
  { label: "validation", anchor: "validation", patterns: [/\bvalidat(?:e|ed|es|ing|ion)\b/i] },
  { label: "simulation", anchor: "simulation", patterns: [/\bsimulat(?:e|ed|es|ing|ion)\b/i] },
  { label: "USB data cable", anchor: "usb-data-cable", patterns: [/\bUSB data cables?\b/i, /\bdata-capable USB cables?\b/i] },
  { label: "controller", anchor: "controller", patterns: [/\bcontrollers?\b/i] },
  { label: "sensor", anchor: "sensor", patterns: [/\bsensors?\b/i] },
  { label: "code", anchor: "code", patterns: [/\bcode\b/i] },
];

const glossary = `# Glossary

This is an ordinary-language reading aid for the Workshop files, not certified engineering advice. It helps you follow a plan, but it does not replace the current documentation for your exact parts or advice from a qualified engineer when safety depends on a decision.

## BOM

A bill of materials: the list of parts and quantities a build needs. Example: a sensor BOM might list one Pico, one BME280 board, four jumper wires, and one USB cable.

## Firmware

Software stored on a small device so it knows what to do. Example: the Pico runs firmware that reads the sensor once each second.

## GPIO

Pins on a controller that software can use as inputs or outputs. Example: a GPIO pin can read a button or send a control signal, but only within the board's documented electrical limits.

## I2C

A way for nearby electronic parts to exchange data over two signal wires, plus power and ground connections. Example: the Pico asks the BME280 for a temperature reading over I2C.

## Voltage

The electrical difference between two points, measured in volts. Example: measure between a board's 3.3 V pin and ground rather than calling one pin “the voltage.”

## Current

The rate of electrical charge flowing through a path, measured in amperes. Example: a motor can briefly draw more current when it starts than while it is already moving.

## Ground

In electronics, the shared reference and return path for signals and power; in a mechanism, the fixed link or frame. Example: the sensor and Pico need the documented common electrical ground, while a four-bar's two fixed pivots sit on its ground link.

## Polarity

Which connection is positive and which is negative. Example: reversing a polarized power connection can damage a part, so check labels before applying power.

## Pinout

A map showing what each physical pin does. Example: a pinout distinguishes physical pin 1 from a software name such as GP0.

## Power budget

A check that a source can supply all connected parts, including short peaks, with reasonable margin. Example: add the computer, display, and fan needs before choosing a cyberdeck power supply.

## Hysteresis

Using separate switch-on and switch-off points to prevent rapid flickering near one boundary. Example: an LED can turn on at 28 °C but wait until 26 °C to turn off.

## Calibration

Comparing a measurement with a trusted reference and recording or correcting the difference. Example: compare a temperature sensor with a suitable reference under controlled conditions before claiming accuracy.

## Tolerance

The allowed difference between an intended value and an acceptable real value. Example: a 20.0 mm hole spacing with ±0.2 mm tolerance may accept measurements from 19.8 to 20.2 mm.

## CAD

Computer-aided design: software used to make editable drawings or 3D part models. Example: use CAD to place measured mounting holes and connector openings in an enclosure.

## Mesh

A 3D surface made from many connected polygons, often triangles. Example: an STL mesh is useful for printing but usually less editable than the original CAD model.

## Degrees of freedom

The independent ways something can move. Example: a door hinge normally leaves one degree of freedom—rotation about its hinge line.

## Kinematics

The study of how parts move without first solving the forces that cause the motion. Example: a linkage preview can show the rocker's path but not prove that a motor is strong enough.

## Crank

The four-bar link used as the motion input, often rotating around a fixed pivot. Example: turning the crank by hand moves the coupler.

## Coupler

The four-bar link joining the crank to the rocker. Example: a marked point on the coupler traces a path as the linkage moves.

## Rocker

The four-bar link that swings around the other fixed pivot. Example: the rocker may wave a desk creature's arm through a limited arc.

## Torque

A turning effect around an axis, equal to force times its perpendicular distance from that axis. Example: pushing farther from a hinge creates more torque with the same force.

## Stall

A condition where a motor is commanded to move but cannot. Example: a servo pressed against a hard stop may buzz, heat up, and draw high current while stalled.

## Thermal throttling

Automatic slowing used by a computer to reduce heat. Example: a Raspberry Pi may lower performance when its cooling cannot carry heat away fast enough.

## Strain relief

A feature that keeps pulling or bending force on a cable from reaching a fragile connection. Example: a clamp inside an enclosure can protect wires where they meet a connector.

## Logic level

The voltage range an electronic input treats as low or high. Example: two boards can use similar-looking signals but still require a compatibility check if their documented logic levels differ.

## Source claim

A statement tied to evidence that readers can inspect. Example: “this board has an RP2040” is a source claim when it points to the manufacturer's board page.

## Validation

Checking that a result meets a stated need using an observable test. Example: ten successful motion cycles can test repeatability, but they do not prove lifetime durability.

## Simulation

A computer model of selected real-world behavior. Example: a motion simulation can reveal a likely collision, but its result depends on what the model includes.

## USB data cable

A USB cable that carries data as well as power. Example: a charge-only cable may light a Pico but cannot copy code to it or open its serial output.

## Controller

The small board or computer that follows instructions and coordinates other parts. Example: the Pico is the controller that asks the BME280 for a reading and changes the LED.

## Sensor

A part that turns something it observes into data. Example: the BME280 reports temperature, humidity, and air pressure to the controller.

## Code

Written instructions a computer or controller can run. Example: CircuitPython uses a file named code.py on the Pico to decide when to read the sensor and light the LED.
`;

const starts: Record<LearningTemplate, string> = {
  sensor: `# Start here — Pico + BME280 temperature indicator

A **controller** is a small board that follows instructions: here, it is the original Raspberry Pi Pico. A **sensor** turns something it observes into numbers: here, the BME280 reports temperature, humidity, and air pressure. **Code** is the set of instructions in \`firmware/code.py\` that tells the Pico when to read the sensor and when to use its built-in LED.

## What you will build and learn

You will connect an original, non-W Raspberry Pi Pico to a BME280, run CircuitPython \`code.py\`, view readings over USB, and use the Pico's built-in LED as a temperature indicator. You will learn how four labeled wires, a sensor address, and two temperature thresholds work together.

## Prerequisites and what you need

You do not need previous programming or electronics experience. You do need to identify the exact board labels and follow the wiring plan rather than wire by color. Gather the original Pico, BME280 breakout, four suitable jumper wires, a breadboard if needed, and a USB data cable—not a charge-only cable. A computer with a serial-capable editor is also needed.

## Your first small step

With USB disconnected, place the Pico and BME280 side by side and find the labels **GP0**, **GP1**, **3V3(OUT)**, and **GND** on the Pico or its official pinout. Do not connect wires yet. Success is visible when you can point to all four intended Pico endpoints and the sensor's SDA, SCL, power, and ground labels without guessing.

Next, follow [README.md](README.md). Keep [GLOSSARY.md](GLOSSARY.md) open when a term is unfamiliar. Open [ENGINEERING.md](ENGINEERING.md) before wiring or powering anything; it contains the exact interfaces, stop conditions, and checks that the welcome intentionally does not simplify.
`,
  linkage: `# Start here — four-bar linkage

You will make a flat moving loop from four links: one stays fixed, one is the input, one carries motion across the loop, and one swings at the output. The technical names—ground, crank, coupler, and rocker—are in [GLOSSARY.md](GLOSSARY.md).

## What you will build and learn

Start with a card or sheet-material model that moves by hand. You will learn how pivot spacing changes the path, how to notice binding and dead points, and why an on-screen motion preview is not a strength or clearance test.

## Prerequisites and what you need

No mechanism experience is required. Gather stiff card, a ruler, a pencil, four removable paper fasteners or another safe low-force pivot method, and a surface you may mark. Later versions may use measured fasteners and fabricated parts.

## Your first small step

Draw four dots for the pivot centers using the current link lengths, then label them ground, crank, coupler, and rocker. Success is visible when the four segments can form one closed loop on the page; do not cut or drill yet.

Continue with [README.md](README.md). Open [ENGINEERING.md](ENGINEERING.md) before transferring dimensions to CAD or rigid material; it holds the measurement, assembly, collision, and validation work that turns a sketch into an engineering plan.
`,
  "desk-robot": `# Start here — one-servo desk creature

This project turns one small motor's rotation into one expressive movement. The controller sends the command, the servo turns to a requested angle, and a simple linkage moves the visible feature.

## What you will build and learn

You will prototype a stable desk creature with one slow, bounded motion. You will learn the difference between a control signal and motor power, how link geometry shapes motion, and how to find limits without forcing the servo.

## Prerequisites and what you need

Some basic sensor or controller practice and a card linkage experiment are helpful but not required. Gather card and removable fasteners for the unpowered mechanism study. Do not choose a power connection from wire color or from this welcome; the exact controller, servo, supply, and documentation must agree.

## Your first small step

Cut no parts and apply no power. Move the viewer's angle control slowly and choose one visible feature you want the servo to move. Success is visible when you can describe one start position, one end position, and the nearby collision or pinch area to avoid.

Read [README.md](README.md), then use [GLOSSARY.md](GLOSSARY.md) as needed. Open [ENGINEERING.md](ENGINEERING.md) before selecting wiring, applying power, or fabricating the final mechanism; it contains the required limits, staged checks, and unresolved risks.
`,
  cyberdeck: `# Start here — personal computer build

A cyberdeck is a small computer assembled from several cooperating parts. The computer board runs software; the display, storage, keyboard, cooling, and power parts connect through specific plugs and have to fit together physically.

## What you will build and learn

You will plan a Raspberry Pi 5 computer that can boot, expose its intended connectors, stay cool, and be opened for service. You will learn to treat power, connectors, software, cooling, and enclosure space as one integrated system.

## Prerequisites and what you need

You should be comfortable following manufacturer setup instructions and recording part numbers. Gather the exact parts you already own, a ruler or calipers, paper or card for a full-size layout, and each part's primary documentation. Leave battery integration out of the first version.

## Your first small step

Place the unpowered board and intended cable plugs on paper and trace a loose rectangle around them, leaving room for cable exits. Success is visible when every connector you plan to use has a named cable and a clear direction in which that cable can leave the rectangle.

Use [README.md](README.md) for the project overview and [GLOSSARY.md](GLOSSARY.md) for unfamiliar terms. Open [ENGINEERING.md](ENGINEERING.md) before buying missing subsystems, powering the bench assembly, or designing an enclosure; it is the checklist for compatibility, measurements, thermals, and validation.
`,
  blank: `# Start here — your own engineering project

An engineering project begins with an observable outcome, not a shopping list. This template gives you places to record what should happen, what is still unknown, and what evidence will show that a choice worked.

## What you will build and learn

You choose the build. You will learn to turn an idea into a small first experiment, separate requirements from preferences, keep claims tied to sources or observations, and revise the plan as evidence arrives.

## Prerequisites and what you need

No technical specialty is required. Bring the idea, its intended user, the setting where it should work, and any hard limits such as size, cost, time, or available tools. Do not buy parts until a requirement or experiment gives them a purpose.

## Your first small step

Finish this sentence in one line: “A person can ___, in ___ setting, and I will know it works when ___.” Success is visible when another person can read that line and describe the same result without asking what “better” means.

Read [README.md](README.md), consult [GLOSSARY.md](GLOSSARY.md) when needed, and then open [ENGINEERING.md](ENGINEERING.md) to record requirements, interfaces, a smallest useful test, expected observations, and stop conditions.
`,
};

const nextSteps: Record<LearningTemplate, string> = {
  sensor: `- **Learn the sensor fundamentals.** Goal: wire a known controller and sensor, load code, and recognize healthy serial output. Prerequisite: none beyond identifying the exact parts. Stay with [this sensor tutorial](workshop:template/sensor).
- **Add controlled movement.** Goal: reuse controller, code, and validation habits while learning a servo signal and motion limits. Prerequisite: complete or read the sensor stages. Open the [desk-robot tutorial](workshop:template/desk-robot).
- **Plan a larger electronic system.** Goal: see how power, connectors, cooling, and software interact. Prerequisite: confidence checking labels and primary documentation. Open the [cyberdeck tutorial](workshop:template/cyberdeck).`,
  linkage: `- **Learn the mechanism.** Goal: make a hand-driven four-bar move without binding and record what each link does. Prerequisite: none. Stay with [this linkage tutorial](workshop:template/linkage).
- **Put the mechanism under control.** Goal: connect a bounded linkage to one servo without forcing either part. Prerequisite: a card linkage that moves freely by hand. Open the [desk-robot tutorial](workshop:template/desk-robot).
- **Define a different mechanism project.** Goal: carry the same requirements and validation habits into your own idea. Prerequisite: one observable motion goal. Open the [blank project](workshop:template/blank).`,
  "desk-robot": `- **Fill an electronics gap.** Goal: learn controller, sensor, wiring, code, and visible fault behavior on a build with no motor load. Prerequisite: none. Open the [sensor tutorial](workshop:template/sensor).
- **Fill a mechanism gap.** Goal: understand crank, coupler, rocker, clearances, and hand checks before adding a servo. Prerequisite: none. Open the [linkage tutorial](workshop:template/linkage).
- **Combine both strands here.** Goal: create one slow, bounded expressive movement and validate it in stages. Prerequisite: the relevant sensor and linkage fundamentals, or equivalent experience. Return to the [desk-robot tutorial](workshop:template/desk-robot).
- **Scale up integration thinking.** Goal: coordinate power, connectors, software, cooling, and an enclosure. Prerequisite: comfort documenting interfaces and stop conditions. Open the [cyberdeck tutorial](workshop:template/cyberdeck).`,
  cyberdeck: `- **Practice a small electronic interface.** Goal: connect a controller, sensor, USB data, and software while keeping evidence visible. Prerequisite: none. Open the [sensor tutorial](workshop:template/sensor).
- **Practice mixed hardware on a smaller build.** Goal: coordinate a controller, power choice, software limits, and a moving mechanism. Prerequisite: basic wiring and mechanism checks, or the sensor and linkage tutorials. Open the [desk-robot tutorial](workshop:template/desk-robot).
- **Integrate the computer.** Goal: make power, connectors, software, cooling, and enclosure access work as one system. Prerequisite: exact part identities and their primary documentation. Stay with [this cyberdeck tutorial](workshop:template/cyberdeck).
- **Adapt the process to a custom device.** Goal: define a different system from observable requirements instead of copying a parts list. Prerequisite: a clear user and setting. Open the [blank project](workshop:template/blank).`,
  blank: `- **Start with electronics.** Goal: learn a controller, sensor, wiring, code, and validation through visible readings. Prerequisite: none. Open the [sensor tutorial](workshop:template/sensor).
- **Start with mechanisms.** Goal: learn how four link lengths create motion through a card prototype. Prerequisite: none. Open the [linkage tutorial](workshop:template/linkage).
- **Combine electronics and motion.** Goal: build one carefully bounded servo behavior. Prerequisite: sensor/controller and linkage basics, or equivalent experience. Open the [desk-robot tutorial](workshop:template/desk-robot).
- **Practice system integration.** Goal: coordinate power, connectors, software, cooling, and enclosure decisions. Prerequisite: confidence checking exact parts and primary documents. Open the [cyberdeck tutorial](workshop:template/cyberdeck).
- **Shape your own project.** Goal: define an observable outcome and the smallest test that reduces its biggest unknown. Prerequisite: an idea and its intended setting. Stay with the [blank project](workshop:template/blank).`,
};

function learningPath(templateId: LearningTemplate): string {
  return `# Learning path — ${templateNames[templateId]}

Choose the first step whose goal is useful and whose prerequisite you already meet. You may skip this guidance and work directly from [ENGINEERING.md](ENGINEERING.md).

## Choose your next step

${nextSteps[templateId]}

## Files in this project

- [START_HERE.md](START_HERE.md) gives the plain-language first action.
- [README.md](README.md) is the project overview and build sequence.
- [GLOSSARY.md](GLOSSARY.md) explains terms used across Workshop projects.
- [ENGINEERING.md](ENGINEERING.md) records technical requirements, interfaces, risks, and validation.

## Primary learning references

Use the references that match your project and exact hardware:

- [Raspberry Pi Pico product page](https://www.raspberrypi.com/products/raspberry-pi-pico/)
- [CircuitPython for the original Raspberry Pi Pico](https://circuitpython.org/board/raspberry_pi_pico/)
- [Official CircuitPython BME280 examples](https://docs.circuitpython.org/projects/bme280/en/latest/examples.html)
- [MicroPython RP2 quick reference](https://docs.micropython.org/en/latest/rp2/quickref.html)
- [Blender manual](https://docs.blender.org/manual/en/latest/)
- [KiCad documentation](https://docs.kicad.org/)
`;
}

function isLearningTemplate(templateId: string): templateId is LearningTemplate {
  return Object.hasOwn(templateNames, templateId);
}

/** Return the beginner-facing files added to a supported project template. */
export function getLearningFiles(templateId: string): Record<string, string> {
  if (!isLearningTemplate(templateId)) {
    throw new Error(`Unknown learning template: ${templateId}`);
  }

  return {
    "START_HERE.md": starts[templateId],
    "GLOSSARY.md": glossary,
    "LEARNING_PATH.md": learningPath(templateId),
  };
}

function searchableMarkdown(markdown: string): string {
  let fence: { marker: string; length: number } | undefined;

  return markdown
    .split(/(\r?\n)/)
    .map((part) => {
      if (/^\r?\n$/.test(part)) return fence ? " " : part;

      const fenceMatch = part.match(/^ {0,3}(`{3,}|~{3,})/);
      if (fenceMatch) {
        const marker = fenceMatch[1][0];
        if (!fence) {
          fence = { marker, length: fenceMatch[1].length };
        } else if (marker === fence.marker && fenceMatch[1].length >= fence.length) {
          fence = undefined;
        }
        return " ".repeat(part.length);
      }
      if (fence) return " ".repeat(part.length);

      return part
        .replace(/(`+).*?\1/g, " ")
        .replace(/!?\[[^\]]*\]\[[^\]]*\]/g, " ")
        .replace(/!?\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/<https?:\/\/[^>]+>/gi, " ")
        .replace(/https?:\/\/\S+/gi, " ");
    })
    .join("");
}

/**
 * Add a deterministic glossary index without rewriting the engineering plan.
 * Matches inside fenced code, inline code, existing links, and URLs are ignored.
 */
export function addLearningLinks(markdown: string): string {
  if (/^## Terms used in this plan\s*$/m.test(markdown)) return markdown;

  const searchable = searchableMarkdown(markdown);
  const matchingTerms = glossaryTerms
    .map((term) => ({
      term,
      index: Math.min(
        ...term.patterns
          .map((pattern) => pattern.exec(searchable)?.index)
          .filter((index): index is number => index !== undefined),
      ),
    }))
    .filter(({ index }) => Number.isFinite(index))
    .sort((left, right) => left.index - right.index);

  if (matchingTerms.length === 0) return markdown;

  const separator = markdown.endsWith("\n") ? "\n" : "\n\n";
  const links = matchingTerms
    .map(({ term }) => `- [${term.label}](GLOSSARY.md#${term.anchor})`)
    .join("\n");

  return `${markdown}${separator}## Terms used in this plan\n\n${links}\n`;
}
