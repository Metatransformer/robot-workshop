import type { LearningModule, LearningSource } from "./types";

const MIT_DESIGN: LearningSource = {
  title: "MIT OpenCourseWare: Design and Manufacturing I",
  url: "https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/pages/syllabus/",
};

const MIT_CIRCUITS: LearningSource = {
  title: "MIT OpenCourseWare: Circuits and Electronics",
  url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
};

const MODERN_ROBOTICS: LearningSource = {
  title: "Modern Robotics",
  url: "https://modernrobotics.northwestern.edu/",
};

const MISSING_SEMESTER: LearningSource = {
  title: "The Missing Semester of Your CS Education",
  url: "https://missing.csail.mit.edu/",
};

const MULTIMETER_CONTINUITY: LearningSource = {
  title: "Adafruit: Multimeters — Continuity",
  url: "https://learn.adafruit.com/multimeters/continuity",
};

const LIPO_GUIDE: LearningSource = {
  title: "Adafruit: Li-Ion and LiPoly Batteries",
  url: "https://learn.adafruit.com/li-ion-and-lipoly-batteries",
};

const MICRO_PYTHON_RP2: LearningSource = {
  title: "MicroPython RP2 Quick Reference",
  url: "https://docs.micropython.org/en/latest/rp2/quickref.html",
};

export const foundationsElectronicsModules: LearningModule[] = [
  {
    id: "units-estimation",
    track: "foundations",
    title: "Units, scale, and estimates",
    summary: "Use dimensions and order-of-magnitude checks to choose plausible parts before detailed design, such as rejecting an undersized power source for a desk fan.",
    minutes: 40,
    level: "Foundation",
    prerequisites: [],
    outcomes: [
      "Convert units, preserve dimensions through a calculation, and make a bounded estimate that can eliminate an implausible design choice.",
    ],
    concepts: `A number without a unit is rarely a useful engineering statement. “The fan needs 3” could mean 3 volts, 3 amperes, or 3 watts, each implying a different build. Units behave like algebraic factors: 250 mA is 0.250 A, and multiplying 5 V by 0.250 A gives 1.25 V·A, called watts for DC power. Prefixes encode powers of ten: milli is 10^-3, micro is 10^-6, and kilo is 10^3. Writing conversions as fractions whose equal quantities cancel—250 mA × (1 A / 1000 mA)—makes mistakes visible.

Dimensions describe the kind of quantity independently of the chosen unit. Speed has dimension length/time, so a proposed expression for speed must reduce to that form. Dimensional agreement cannot prove an equation is correct, but disagreement proves it is wrong. Scale adds another filter. Before selecting a battery for a small blower, estimate power from rated voltage and current, operating time from energy divided by power, then include a loss margin. A one-significant-figure estimate is often enough to reject a coin cell and move toward a suitable protected pack.

Bounds are more honest than false precision. If a motor draws 0.2–0.5 A at 5 V, its electrical power is 1–2.5 W. A 10 Wh source would have an ideal runtime of 4–10 h; conversion loss and startup current shorten that. Keep assumptions beside the result. A common failure is mixing mA and A, producing a thousandfold error that still looks numerically tidy. Another is reporting six decimal places from rough inputs. For early build decisions, a defensible range with units beats a precise-looking fiction.`,
    workedExample: {
      problem: "Estimate whether a USB power bank labeled 10,000 mAh at a 3.7 V nominal cell voltage can run a 5 V fan drawing 0.40 A for an eight-hour workday; assume 75% of nominal cell energy reaches the fan.",
      steps: [
        "Convert capacity: 10,000 mAh = 10 Ah.",
        "Nominal cell energy is 3.7 V × 10 Ah = 37 Wh; do not multiply cell-rated ampere-hours by the 5 V USB output.",
        "Apply the delivery factor: 37 Wh × 0.75 = 27.75 Wh usable.",
        "Fan power is 5 V × 0.40 A = 2.0 W; runtime is 27.75 Wh / 2.0 W = 13.9 h.",
      ],
      result: "The estimate exceeds eight hours with roughly 5.9 h of modeled margin.",
      sanityCheck: "Eight hours needs 2.0 W × 8 h = 16 Wh, less than 27.75 Wh. The estimate ignores battery shutoff behavior and fan startup current, which should be tested.",
    },
    exercise: {
      question: "A sensor is specified to draw 600 µA. Which current in amperes should be used in a power equation?",
      choices: ["0.0006 A", "0.006 A", "0.6 A", "600,000 A"],
      answerIndex: 0,
      explanation: "Micro means 10^-6, so 600 µA = 600 × 10^-6 A = 0.0006 A. Choosing 0.6 A treats microamperes as milliamperes, a thousandfold error; 0.006 A misplaces one decimal power; 600,000 A reverses the conversion fraction.",
    },
    lab: {
      goal: "Estimate and then measure the runtime-relevant current of a low-voltage USB fan.",
      equipment: ["5 V USB fan", "USB inline voltage/current meter", "USB power bank", "timer", "notes sheet"],
      steps: [
        "Read the fan and power-bank labels without opening either device; record units and label uncertainty.",
        "Predict fan power and eight-hour energy from the rated values before connecting it.",
        "Connect the inline meter, run the fan for two minutes, and record the displayed voltage and current every 30 seconds.",
        "Deliberately restrict the fan inlet with a card held outside the guard, without touching the blades; diagnose whether current rises, falls, or stays similar.",
        "Remove the card and confirm that readings return toward the initial range.",
      ],
      observe: [
        "Expected: measured voltage remains near 5 V and current is of the same order as the label; actual readings must be recorded rather than replaced by the expectation.",
        "Expected fault clue: inlet restriction changes airflow and may change current slightly; the sign depends on fan design, so the actual direction is evidence, not a pass/fail target.",
      ],
      transfer: "Estimate the daily energy of a small USB screen or camera using its label, then state a plausible low/high range and the assumption that dominates it.",
      cautions: ["Use only intact low-voltage USB equipment; do not open a mains-powered fan, charger, or power bank.", "Keep cards, hair, and fingers outside the blade guard."],
    },
    projectIds: ["desk-robot", "cyberdeck"],
    glossary: ["unit", "dimension", "estimate", "power", "significant-figures"],
    sources: [MIT_DESIGN, MIT_CIRCUITS],
  },
  {
    id: "algebra-trig",
    track: "foundations",
    title: "Algebra and trigonometry for builders",
    summary: "Rearrange design equations and resolve right triangles to select dimensions such as a camera mast length or linkage angle.",
    minutes: 55,
    level: "Foundation",
    prerequisites: ["units-estimation"],
    outcomes: [
      "Solve a one-variable engineering equation and use sine, cosine, or tangent to turn a physical triangle into a checked dimension.",
    ],
    concepts: `Algebra is the practice of preserving equality while exposing the quantity you need. If both sides of an equation describe the same physical situation, applying the same nonzero multiplication, division, addition, or subtraction to both sides keeps them equal. For P = VI, dividing both sides by V gives I = P/V. Write the symbolic rearrangement before inserting numbers; this keeps units visible and makes the method reusable.

Trigonometry connects an angle to side ratios in a right triangle. Relative to an angle θ, sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse, and tan θ = opposite/adjacent. A tilted camera mast of length L is a hypotenuse. Its vertical rise is L sin θ and its horizontal reach is L cos θ when θ is measured above horizontal. A diagram matters because “opposite” and “adjacent” change with the chosen angle. Degrees and radians are two angle units; calculator mode must match the input.

Equations also expose build tradeoffs. If a camera needs 180 mm of vertical rise at 60°, L = 180 mm / sin 60° ≈ 208 mm. Selecting a 210 mm mast is defensible; cutting 180 mm because the desired rise was mistaken for the sloped length is not. Check limiting cases: as θ approaches 90°, vertical rise should approach L and horizontal reach should approach zero.

A frequent failure is moving a term across an equals sign by memorized sign-changing rather than performing the same operation on both sides. Another is feeding 60 degrees into a calculator set to radians, yielding a plausible-looking but wrong result. Keep units attached, sketch the triangle, label the reference angle, and test a simple limit before committing material.`,
    workedExample: {
      problem: "A camera bracket rises 120 mm while extending 160 mm horizontally. Find its straight brace length and angle above horizontal.",
      steps: [
        "Treat rise and run as perpendicular sides: L = sqrt((120 mm)^2 + (160 mm)^2).",
        "Compute L = sqrt(14,400 + 25,600) mm = sqrt(40,000) mm = 200 mm.",
        "Use tan θ = 120/160 = 0.75, so θ = arctan(0.75) = 36.9°.",
      ],
      result: "Use a 200 mm center-to-center brace at approximately 36.9° above horizontal.",
      sanityCheck: "The 3:4:5 triangle scaled by 40 gives 120:160:200, and the angle is below 45° because the rise is smaller than the run.",
    },
    exercise: {
      question: "A 250 mm link is held 30° above horizontal. What is its vertical rise?",
      choices: ["125 mm", "216.5 mm", "500 mm", "7,500 mm"],
      answerIndex: 0,
      explanation: "Rise is the side opposite the angle, so it is 250 mm × sin 30° = 125 mm. 216.5 mm uses cosine and finds horizontal reach instead. 500 mm divides by sine as though rise were known, while 7,500 multiplies the degree count as if it were a ratio.",
    },
    lab: {
      goal: "Predict and verify the geometry of an adjustable cardboard camera bracket.",
      equipment: ["corrugated cardboard", "paper fastener", "ruler", "protractor", "tape", "small inert mass such as an eraser"],
      steps: [
        "Cut a 200 mm strip, mark pivot centers, and assemble it to a cardboard base with the paper fastener.",
        "Set the strip to 30° above horizontal and calculate the expected rise and reach of its far pivot.",
        "Measure actual rise and reach three times, recording parallax and pivot-width uncertainty.",
        "Deliberately set the protractor from vertical while still calling the reading 'above horizontal'; use the inconsistent dimensions to diagnose the reference-angle fault.",
        "Correct the reference and repeat at 45°.",
      ],
      observe: [
        "Expected at 30°: about 100 mm rise and 173 mm reach; actual measurements should differ slightly because the pivot and angle marks have width.",
        "Expected fault clue: using the complementary angle swaps the predicted rise and reach rather than causing random error.",
      ],
      transfer: "Choose a toy-car sensor height and setback, then calculate one brace length and angle that would locate it there.",
      cautions: ["Keep the test mass light so the cardboard joint cannot collapse onto hands or equipment.", "Use scissors or craft tools according to their normal guarding and supervision requirements."],
    },
    projectIds: ["linkage", "sensor"],
    glossary: ["equation", "variable", "sine", "cosine", "radian"],
    sources: [MIT_DESIGN, MODERN_ROBOTICS],
  },
  {
    id: "vectors-frames",
    track: "foundations",
    title: "Vectors and reference frames",
    summary: "Represent direction as well as magnitude and transform simple 2D observations so a robot can interpret a camera or sensor mounted at an angle.",
    minutes: 60,
    level: "Foundation",
    prerequisites: ["algebra-trig"],
    outcomes: [
      "Resolve and rotate a 2D vector between named coordinate frames while checking direction, magnitude, and sign.",
    ],
    concepts: `A scalar has magnitude only: 2 metres, 5 seconds, 12 volts. A vector also has direction. “The toy car moved 2 m” is incomplete for mapping; “2 m east” can be represented by components such as [2, 0] in a frame whose x-axis points east and y-axis north. Components are not intrinsic labels on the motion. They depend on the chosen coordinate frame.

In two dimensions, a vector of magnitude r at angle θ from +x has components x = r cos θ and y = r sin θ. Its magnitude is sqrt(x² + y²). To express a vector from a sensor frame in a body frame rotated by θ, use the rotation matrix R(θ) = [[cos θ, -sin θ], [sin θ, cos θ]]. Multiplying R by the component column rotates the description. Translation is separate: a direction vector is rotated but not shifted, while a point measured from a camera may need both rotation and the camera's position offset.

This distinction drives mounting decisions. A camera facing 90° left of a robot cannot feed its “forward” coordinate directly into robot forward motion. If the camera reports an object 0.40 m along its own forward axis, the body-frame vector is approximately [0, 0.40] m under the stated axis convention. Explicit frame names—camera, body, world—prevent silent sign errors.

A common misconception is that the same pair of numbers describes a vector in every frame. Another is adding a position offset to a velocity or force vector merely because both are drawn as arrows. Name each frame, draw positive axes, state whether the quantity is a point or free vector, and check that rotation preserves magnitude. If the length changes during a pure rotation, the calculation is wrong.`,
    workedExample: {
      problem: "A range sensor points 30° left of a toy car's forward +x axis and reports an obstacle 0.80 m straight ahead in its sensor frame. Find the body-frame components, ignoring sensor position offset.",
      steps: [
        "Represent the sensor reading as [0.80, 0] m in the sensor frame.",
        "Rotate by +30°: x = 0.80 cos 30° = 0.693 m.",
        "Compute y = 0.80 sin 30° = 0.400 m, where +y was defined as left.",
      ],
      result: "The obstacle vector is approximately [0.693, 0.400] m in the car body frame.",
      sanityCheck: "sqrt(0.693² + 0.400²) ≈ 0.800 m, so the pure rotation preserved distance; both components are positive for forward-left.",
    },
    exercise: {
      question: "A robot's body frame has +x forward and +y left. Which body vector describes 0.5 m directly to its right?",
      choices: ["[0, -0.5] m", "[0, 0.5] m", "[-0.5, 0] m", "[0.5, 0] m"],
      answerIndex: 0,
      explanation: "Right is opposite the declared +y direction, hence [0, -0.5] m. [0, 0.5] points left. The other choices lie on the forward/back x-axis. The diagnostic issue is frame convention, not the magnitude.",
    },
    lab: {
      goal: "Map a sensor-relative direction into a toy-car body frame.",
      equipment: ["toy car or paper car outline", "phone camera used only to document", "protractor", "ruler", "masking tape", "small block"],
      steps: [
        "Tape body +x and +y axes on a table and mount or draw a sensor direction 45° left of body +x.",
        "Place the block 300 mm along the sensor axis and predict its body x/y coordinates.",
        "Measure the actual table coordinates from the body origin and record deviations separately for x and y.",
        "Deliberately flip the sign of the sine term; plot that faulty prediction and diagnose it from the mirrored side of the car.",
        "Move the sensor origin 50 mm forward and decide which coordinate receives the translation offset.",
      ],
      observe: [
        "Expected before translation: x and y are each about 212 mm; actual values reflect drawing and placement tolerances.",
        "Expected fault clue: a sine-sign error preserves distance but places the block on the wrong side, unlike a scale error.",
      ],
      transfer: "Sketch frames for a printer head, its carriage, and the page; state which transform would locate a nozzle point on the page.",
      cautions: ["Keep the tabletop area clear so the taped axes do not create a trip or snag hazard.", "Do not use a moving powered car during this geometry exercise."],
    },
    projectIds: ["sensor", "desk-robot"],
    glossary: ["scalar", "vector", "reference-frame", "rotation-matrix", "component"],
    sources: [MODERN_ROBOTICS],
  },
  {
    id: "rates-integration",
    track: "foundations",
    title: "Rates, accumulation, and sampled motion",
    summary: "Connect rates to accumulated quantities so sampling interval becomes an explicit design choice for motion and energy estimates.",
    minutes: 60,
    level: "Foundation",
    prerequisites: ["algebra-trig"],
    relatedStudy: ["units-estimation"],
    outcomes: [
      "Estimate an accumulated quantity from sampled rates and explain how interval size and bias affect the result.",
    ],
    concepts: `A rate says how quickly one quantity changes with another. Speed is distance per time; current is charge per time; power is energy per time. If a toy car travels at a steady 0.30 m/s for 4 s, distance is rate × duration = 1.2 m. When the rate varies, split time into intervals and add each interval's contribution. That sum is the practical idea behind integration.

Formally, if position x changes with velocity v, then v = dx/dt and the change in position is Δx = ∫v dt. With sampled data, a rectangular estimate is Δx ≈ Σ v_k Δt. A trapezoidal estimate uses the average of consecutive samples: Δx ≈ Σ((v_k + v_(k+1))/2)Δt. The same structure estimates energy from power readings or battery charge from current. Units provide a strong check: (m/s)×s becomes m.

Sampling is a design decision. Long intervals save storage but can miss rapid changes, such as a printer carriage accelerating and stopping. Short intervals reveal detail but do not cure a biased sensor. A velocity bias of only 0.01 m/s accumulates 0.6 m of position error in 60 s. For a desk robot, this is why wheel-speed integration needs periodic external correction rather than blind trust.

A common misconception is that integration means merely adding raw samples. Samples must be multiplied by their time widths; otherwise changing the sample rate changes the answer. Another failure is assuming the rate stayed constant between widely spaced readings. State the interpolation assumption, inspect gaps, and compare rectangular and trapezoidal results. Accumulation turns small persistent errors into large drift, so a plausible final number is not evidence that each interval was sound.`,
    workedExample: {
      problem: "A toy car's measured speeds at 0, 1, 2, and 3 s are 0, 0.4, 0.6, and 0.2 m/s. Estimate distance over 3 s with trapezoids.",
      steps: [
        "From 0–1 s: ((0 + 0.4)/2) × 1 s = 0.20 m.",
        "From 1–2 s: ((0.4 + 0.6)/2) × 1 s = 0.50 m.",
        "From 2–3 s: ((0.6 + 0.2)/2) × 1 s = 0.40 m.",
        "Sum the interval distances: 0.20 + 0.50 + 0.40 = 1.10 m.",
      ],
      result: "The sampled trapezoidal estimate is 1.10 m.",
      sanityCheck: "The average speed implied by the result is 1.10 m / 3 s = 0.367 m/s, between the observed minimum and maximum.",
    },
    exercise: {
      question: "A constant current of 0.25 A flows for 8 s. How much charge passes?",
      choices: ["2 C", "0.03125 C", "8.25 C", "32 C"],
      answerIndex: 0,
      explanation: "Charge is the integral of current: 0.25 A × 8 s = 2 A·s = 2 C. Dividing gives 0.03125 with units that do not match charge. Adding the numbers ignores the relationship, and 32 C comes from reversing the multiplication into 8/0.25.",
    },
    lab: {
      goal: "Compare sampled-speed integration with a directly measured travel distance.",
      equipment: ["unpowered toy car", "1 m tape measure", "masking tape", "phone stopwatch or video timer", "spreadsheet or calculator"],
      steps: [
        "Mark a straight 800 mm path and predict a gentle hand-push duration.",
        "Record the car crossing 200 mm marks and compute one average speed per interval.",
        "Accumulate interval distance as speed × measured interval duration and compare with the tape-measured total.",
        "Deliberately omit one interval duration and add the speed numbers alone; diagnose the units and sample-rate dependence of the faulty result.",
        "Repeat with 100 mm marks and compare sensitivity to timing error.",
      ],
      observe: [
        "Expected: correctly paired rate and duration reconstruct approximately 800 mm; record the actual discrepancy and likely timing uncertainty.",
        "Expected fault clue: the raw sum of speeds has units of m/s, not metres, and changes when more samples are taken.",
      ],
      transfer: "Given five one-minute power readings for a screen, describe how you would estimate watt-hours and what behavior might be missed between readings.",
      cautions: ["Use a level floor or table with a stop block so the car cannot roll into people or fall.", "Do not place yourself in a walkway while timing."],
    },
    projectIds: ["desk-robot", "blank"],
    glossary: ["rate", "derivative", "integration", "sample-interval", "drift"],
    sources: [MODERN_ROBOTICS, MIT_CIRCUITS],
  },
  {
    id: "probability-uncertainty",
    track: "foundations",
    title: "Probability and measurement uncertainty",
    summary: "Describe variation honestly and choose margins from repeated evidence instead of treating one sensor reading as exact.",
    minutes: 60,
    level: "Foundation",
    prerequisites: ["units-estimation"],
    relatedStudy: ["rates-integration"],
    outcomes: [
      "Summarize repeated measurements, separate random spread from bias, and use uncertainty to make a conservative threshold decision.",
    ],
    concepts: `Repeated measurements vary because the world and the instrument vary. A camera's range estimate may jitter with texture; a ruler reading changes with viewing angle. Probability gives language for variation, while uncertainty states what is not known about a reported value. Neither means “anything could happen.” They support bounded decisions.

For measurements x_i, the arithmetic mean is x̄ = (1/n)Σx_i. Deviations from the mean reveal spread; the sample standard deviation s = sqrt(Σ(x_i−x̄)²/(n−1)) is one common summary when repeated values are reasonably comparable. Range and median can also be useful, especially for small datasets or outliers. Precision is repeatability; accuracy is closeness to the relevant reference. Closely clustered readings can all share a calibration bias.

Suppose a desk robot must stop at least 100 mm from an obstacle. A sensor averaging 112 mm with several millimetres of noise should not use a 100 mm trigger merely because the mean exceeds it. A threshold can include observed spread, latency, and braking distance. Choosing 130 mm may trade workspace for robustness. The build decision should name that tradeoff and the evidence behind the margin.

A frequent misconception is that averaging removes every error. Averaging reduces independent random noise but preserves systematic offset. Another is interpreting a standard deviation as a guaranteed bound; it is a summary, not an absolute limit, and its probability meaning depends on a model. Record sample count, conditions, resolution, and actual observations. Do not invent confidence from five tidy readings. When stakes rise, improve the reference, collect data across operating conditions, and design for failure rather than polishing decimals.`,
    workedExample: {
      problem: "A distance sensor returns 118, 121, 119, 122, and 120 mm for a fixed target. Find the mean and a simple half-range uncertainty summary.",
      steps: [
        "Sum readings: 118 + 121 + 119 + 122 + 120 = 600 mm.",
        "Divide by five: mean = 120 mm.",
        "Range is 122 − 118 = 4 mm; half-range is 2 mm.",
        "Report the descriptive result as 120 mm ± 2 mm half-range for these five trials, not as a universal guarantee.",
      ],
      result: "The sample mean is 120 mm, with observed values spanning 118–122 mm.",
      sanityCheck: "The mean lies inside the observed range and equals the visibly balanced center of these readings.",
    },
    exercise: {
      question: "A miscalibrated sensor reads exactly 5 mm too high on every trial. Taking 100 readings and averaging mainly does what?",
      choices: ["Reduces random scatter but leaves the 5 mm bias", "Eliminates the 5 mm bias", "Guarantees the true value lies within 1 mm", "Makes the sensor resolution finer"],
      answerIndex: 0,
      explanation: "A fixed systematic offset remains in the average; more samples can reduce independent random scatter around that biased center. Averaging neither guarantees a bound nor changes the instrument's physical resolution. Calibration against a reference is needed to detect and correct the offset.",
    },
    lab: {
      goal: "Measure repeatability and expose bias in a simple camera-based or ruler-based distance estimate.",
      equipment: ["ruler with millimetre marks", "fixed small object", "masking tape", "phone camera", "spreadsheet or calculator"],
      steps: [
        "Tape the object at a ruler reference and take ten independent readings, repositioning your viewpoint each time.",
        "Calculate mean, minimum, maximum, and range; keep the raw actual readings.",
        "Compare the mean with the taped reference and discuss spread separately from offset.",
        "Deliberately start the ruler at a worn or offset edge instead of the zero mark; diagnose the common shift that averaging fails to remove.",
        "Choose a clearance margin for an imaginary moving camera carriage and justify it from observed spread plus a stated extra allowance.",
      ],
      observe: [
        "Expected: viewpoint changes create some random spread; actual spread and any mean offset must be reported, even if zero to the ruler's resolution.",
        "Expected fault clue: the offset-edge readings may remain tightly grouped while being systematically wrong.",
      ],
      transfer: "Design a short repeatability test for the printed width of five nominally identical parts and state how the result would affect a fit clearance.",
      cautions: ["Keep the phone supported away from table edges.", "This exercise characterizes a setup; it does not certify a safety-critical stopping system."],
    },
    projectIds: ["sensor", "linkage"],
    glossary: ["uncertainty", "mean", "standard-deviation", "precision", "accuracy", "bias"],
    sources: [MIT_DESIGN],
  },
  {
    id: "measurement-instruments",
    track: "foundations",
    title: "Measurement instruments and loading",
    summary: "Choose a meter mode and connection that answers the question without distorting or damaging a low-voltage circuit.",
    minutes: 65,
    level: "Foundation",
    prerequisites: ["units-estimation"],
    relatedStudy: ["probability-uncertainty"],
    outcomes: [
      "Configure a digital multimeter for continuity, voltage, resistance, or current and explain how its connection affects the circuit.",
    ],
    concepts: `An instrument turns a physical quantity into a reading, but it also becomes part of the setup. A ruler has finite markings; a camera can introduce perspective; a multimeter has input resistance and lead resistance. Good measurement starts by naming the question: Is this path connected? What voltage exists between these nodes? How much current flows through this branch?

A voltage meter connects in parallel between two nodes and ideally draws no current; a real digital meter has high but finite input resistance. An ammeter connects in series so branch current flows through it and ideally has zero resistance; a real meter adds a small burden and usually contains a fuse. Resistance and continuity modes inject their own small test stimulus, so use them only on an unpowered circuit after stored energy is discharged. Continuity is a fast threshold test, not proof of zero resistance or of a connection that can carry motor current.

Range and resolution matter. A 20 V range displaying 4.98 V has a different uncertainty from a coarse indicator LED. Start with a safe range when the value is unknown, then improve resolution. For a sensor build, first use continuity to validate ground routing while unpowered, then power from a current-limited low-voltage source and measure supply voltage in parallel. This sequence isolates wiring faults before risking components.

The most dangerous common misconception is treating current like voltage and placing a meter in current mode directly across a supply. That creates a low-resistance path, potentially blowing the meter fuse or damaging the source. Another failure is trusting the beep without inspecting which nodes were actually touched. Confirm lead jacks, mode, expected scale, and reference node before every measurement; after current measurements, return the lead to the voltage/resistance jack.`,
    workedExample: {
      problem: "A 1.5 V cell reads 1.47 V open-circuit. Connected to a 15 Ω resistor, the terminal voltage is 1.35 V. Find load current and infer approximate internal resistance.",
      steps: [
        "Load current is I = 1.35 V / 15 Ω = 0.090 A.",
        "The internal voltage drop is 1.47 V − 1.35 V = 0.12 V.",
        "Approximate internal resistance as r = 0.12 V / 0.090 A = 1.33 Ω.",
      ],
      result: "The loaded current is about 90 mA and the inferred internal resistance is about 1.3 Ω for this operating point.",
      sanityCheck: "A positive internal resistance predicts lower terminal voltage under load, matching the observations; the simple model may vary with cell state and temperature.",
    },
    exercise: {
      question: "How should a multimeter measure the voltage across a powered 5 V sensor board?",
      choices: ["Voltage mode, probes in parallel across the two nodes", "Current mode, probes directly across 5 V and ground", "Resistance mode while powered", "Continuity mode with both probes on the same node"],
      answerIndex: 0,
      explanation: "Voltage is a potential difference between nodes, so voltage mode is placed in parallel. Current mode across the supply can create a short. Resistance mode uses its own stimulus and is not for powered circuits. Touching one node twice only checks a trivial local path.",
    },
    lab: {
      goal: "Use continuity, resistance, and voltage modes in a deliberate low-voltage troubleshooting sequence.",
      equipment: ["digital multimeter with intact leads", "2×AA battery holder", "330 Ω resistor", "LED", "breadboard", "jumper wires"],
      steps: [
        "With batteries removed, confirm meter lead jacks and use continuity to map two breadboard rows; record actual beep/no-beep and resistance indications.",
        "Build a series battery–resistor–LED loop, checking LED polarity from its markings before power.",
        "Insert batteries and measure supply and LED voltage in voltage mode, probes in parallel.",
        "Remove power, deliberately move one jumper to an isolated row, then use continuity section by section to locate the open fault.",
        "Restore the wire, repower, and verify that the measured node voltages return near their original values.",
      ],
      observe: [
        "Expected: connected breadboard holes read near lead resistance and the powered LED has a nonzero forward voltage; record actual readings and meter range.",
        "Expected fault clue: continuity changes from present to absent across the misplaced-jumper boundary, localizing the open circuit.",
      ],
      transfer: "Write a three-measurement plan to diagnose a low-voltage printer-style carriage sensor that has power but no output, including reference nodes and meter modes.",
      cautions: ["Use only the 2×AA holder; never probe outlets or mains appliances.", "Resistance and continuity measurements require removed batteries; verify current-mode leads are not used across the holder."],
    },
    projectIds: ["sensor", "cyberdeck"],
    glossary: ["multimeter", "continuity", "resolution", "loading", "reference-node", "burden-voltage"],
    sources: [MULTIMETER_CONTINUITY, MIT_CIRCUITS],
  },
  {
    id: "experimental-method",
    track: "foundations",
    title: "Experiments that distinguish explanations",
    summary: "Turn a build failure into a testable comparison with controls, recorded conditions, and evidence that can separate competing causes.",
    minutes: 55,
    level: "Foundation",
    prerequisites: ["measurement-instruments", "probability-uncertainty"],
    outcomes: [
      "Design a repeatable one-factor experiment with a prediction, control, observations, and a conclusion limited to the evidence.",
    ],
    concepts: `An experiment is useful when possible results distinguish explanations. If a small fan stops intermittently, “try things until it works” can hide the cause. Competing hypotheses might be a loose connector, low source voltage, or a blocked rotor. Each predicts a different pattern. A connector fault may respond to gentle cable movement; a weak source may show voltage sag; a blockage should correlate with mechanical resistance.

Start with a specific question and response variable. Define the factor you will change, hold other relevant conditions as constant as practical, and state predictions before collecting data. A control or baseline shows what happens without the change. Repetition reveals variability. Record actual observations separately from expected ones, including inconvenient outcomes. An experimental conclusion should say which hypothesis the result supports under tested conditions, not declare universal proof.

Quantitative comparisons need normalization. If comparing two toy-car wheel materials, use the same car mass, surface, start method, and distance. Measure travel time or stopping distance, not “felt faster.” Randomize trial order when warming batteries or changing surfaces could create a trend. For a sensor, a build decision such as adding a shield should follow a measurable improvement across representative lighting, not one successful demonstration.

A common failure is changing several things together—battery, code, wiring, and sensor angle—then crediting the last change. Another is confirmation bias: repeating failed trials but stopping after the first desired result. Predefine the number of trials and decision rule. Null results are information; they may reject a hypothesis or reveal that the measurement lacks sensitivity. The method does not remove judgment, but it makes the chain from observation to design choice inspectable and repeatable.`,
    workedExample: {
      problem: "Two wheel materials are tested for 1.0 m travel. Foam trials take 4.2, 4.0, 4.1 s; plastic trials take 5.0, 4.8, 4.9 s. Compare mean speed under the tested conditions.",
      steps: [
        "Foam mean time = (4.2 + 4.0 + 4.1)/3 = 4.1 s, so pooled distance/time speed ≈ 1.0 m / 4.1 s = 0.244 m/s.",
        "Plastic mean time = (5.0 + 4.8 + 4.9)/3 = 4.9 s, so mean speed ≈ 0.204 m/s.",
        "Relative difference is (0.244 − 0.204)/0.204 ≈ 0.196, or about 20%.",
      ],
      result: "Foam produced about 20% higher pooled distance/time speed in these six controlled trials. This ratio is not the arithmetic mean of the individual trial speeds.",
      sanityCheck: "The shorter mean time must correspond to higher speed over the same distance. The data do not establish performance on other surfaces or loads.",
    },
    exercise: {
      question: "To test whether a sensor hood reduces sunlight errors, which comparison is most diagnostic?",
      choices: ["Alternate hood/no-hood trials at the same angles and light levels", "Change the hood, code threshold, and sensor angle together", "Test the hood once indoors", "Keep only trials where the hood succeeds"],
      answerIndex: 0,
      explanation: "Alternating a single factor under matched conditions ties differences to the hood more credibly and reduces time-order effects. Changing three variables confounds causes; one indoor trial does not test sunlight; discarding failures biases the evidence.",
    },
    lab: {
      goal: "Determine whether a paper hood changes a light sensor's repeatability without claiming more than the data show.",
      equipment: ["low-voltage light sensor or phone light-sensor app", "paper hood", "fixed lamp", "ruler", "timer", "data table"],
      steps: [
        "Choose one fixed sensor-to-lamp distance and define the reading spread as the response variable.",
        "Predict how the hood will affect the mean and range, then precommit to five alternating trials per condition.",
        "Collect actual hood/no-hood readings without moving lamp or sensor marks.",
        "Deliberately shift the lamp for one marked trial; identify it as a protocol fault and analyze both with and without it rather than silently deleting it.",
        "Compare means and ranges, then write a conclusion limited to this geometry and lamp.",
      ],
      observe: [
        "Expected: the hood may reduce stray-light variation but can also lower the mean; actual direction and magnitude must come from the recorded trials.",
        "Expected fault clue: the shifted-lamp trial changes both conditions' comparability and should be traceable in notes.",
      ],
      transfer: "Plan a controlled test of whether a vacuum-blower model's inlet shape changes airflow, naming one response measure, three controls, and a stopping rule.",
      cautions: ["Use a cool low-voltage lamp or ambient light; keep paper away from hot bulbs.", "Do not infer eye-safety, appliance safety, or outdoor reliability from this bench experiment."],
    },
    projectIds: ["sensor", "blank"],
    glossary: ["hypothesis", "control", "independent-variable", "response-variable", "confound", "repeatability"],
    sources: [MIT_DESIGN],
  },
  {
    id: "engineering-workflow",
    track: "foundations",
    title: "An evidence-driven engineering workflow",
    summary: "Translate a need into testable requirements, compare concepts, prototype the riskiest assumption, and leave a traceable build record.",
    minutes: 70,
    level: "Foundation",
    prerequisites: ["units-estimation"],
    relatedStudy: ["vectors-frames", "experimental-method"],
    outcomes: [
      "Create a compact requirement-to-test record and use it to choose between two build concepts without erasing unresolved risk.",
    ],
    concepts: `Engineering begins with a need, but a build becomes tractable through requirements: statements that are specific enough to test. “Make a good desk robot” is a wish. “Stop at least 120 mm from a matte obstacle while moving at 0.15 m/s on the test surface” links behavior, conditions, and a threshold. Constraints limit the solution—budget, size, voltage, tools—while preferences help rank acceptable options.

A practical loop is define, explore, choose, prototype, test, and revise. First map functions rather than favorite parts: sense distance, decide when to stop, remove motor power, and support the sensor. Generate multiple concepts, then compare them against weighted criteria with assumptions visible. A decision matrix does not make judgment objective; it makes reasoning inspectable. Prototype the highest-risk unknown early. If sensor performance in sunlight is uncertain, test that before designing a polished enclosure.

Traceability connects each requirement to evidence. A verification table can list requirement, method, result, date, and artifact. Versioned notes, photographs, wiring diagrams, and small commits explain what changed and why. For a camera mount, the build decision might be a 210 mm brace because calculation predicts the location and a cardboard prototype confirms clearance. Record both; neither replaces the other.

A common failure is solution fixation: writing requirements that secretly mandate the first idea. Another is moving the goalposts after a failed test or polishing low-risk details while a core assumption remains unknown. A prototype is a question made physical, not automatically a smaller final product. Treat failures as evidence, keep unresolved items explicit, and revise either the design or a requirement only with a reason. A reproducible trail lets another builder challenge the decision instead of guessing what happened.`,
    workedExample: {
      problem: "Choose a sensor mount using weighted scores. Rigidity weight 3, adjustability weight 2, build time weight 1. Fixed mount scores 5,1,5; slotted mount scores 3,5,3 on a 1–5 scale.",
      steps: [
        "Fixed weighted score = 3×5 + 2×1 + 1×5 = 22.",
        "Slotted weighted score = 3×3 + 2×5 + 1×3 = 22.",
        "The equal totals expose a tradeoff rather than select a winner.",
        "Choose a risk test: measure whether the slotted mount's lower assumed rigidity still meets the image-stability requirement.",
      ],
      result: "The matrix produces a tie; a targeted rigidity prototype is the next justified action.",
      sanityCheck: "Weights sum to 6, so any total must lie from 6 to 30. Both scores of 22 are within range and should not be reported as proof of equal real performance.",
    },
    exercise: {
      question: "Which requirement is most directly verifiable?",
      choices: ["The robot shall stop 120–150 mm from a flat target in 9 of 10 trials on the named surface", "The robot shall feel safe", "The robot shall use an ultrasonic sensor", "The robot shall be innovative"],
      answerIndex: 0,
      explanation: "The first statement defines a measurable behavior, range, repetition count, and condition. “Feel safe” and “innovative” lack tests. Mandating a sensor is a design constraint, not the desired stopping performance, and can prematurely exclude alternatives.",
    },
    lab: {
      goal: "Produce and execute one traceable requirement test for a paper desk-robot subsystem.",
      equipment: ["paper or cardboard", "ruler", "tape", "small inert mass", "phone camera", "notebook or versioned text file"],
      steps: [
        "Write one measurable requirement for a camera mast, including load, height range, and a simple pass criterion.",
        "Sketch fixed and adjustable concepts and record two criteria plus one unresolved assumption for each.",
        "Build the smallest cardboard prototype that tests the highest-risk assumption and predict its behavior.",
        "Deliberately loosen one tape joint as a fault; use the requirement test to identify which metric changes rather than merely calling it bad.",
        "Record actual result, photograph the setup, and write the next design decision with its evidence and remaining uncertainty.",
      ],
      observe: [
        "Expected: a sound joint supports the stated inert test mass within the chosen deflection limit; actual deflection and setup conditions belong in the record.",
        "Expected fault clue: the loose joint should increase deflection or reduce repeatability, linking a physical cause to a requirement metric.",
      ],
      transfer: "Draft a requirement-to-test row for choosing a low-voltage blower in a vacuum-cleaner analogue, including airflow proxy, runtime, and a clear non-equivalence statement.",
      cautions: ["Use only light inert loads and keep the prototype below eye level.", "A paper prototype does not validate structural, electrical, or product safety."],
    },
    projectIds: ["desk-robot", "blank"],
    glossary: ["requirement", "constraint", "prototype", "verification", "traceability", "decision-matrix"],
    sources: [MIT_DESIGN, MISSING_SEMESTER],
  },
  {
    id: "voltage-current-resistance",
    track: "electronics",
    title: "Voltage, current, and resistance",
    summary: "Relate electrical push, flow, and opposition to choose a current-limiting resistor and predict node behavior in a low-voltage build.",
    minutes: 55,
    level: "Foundation",
    prerequisites: ["units-estimation", "measurement-instruments"],
    outcomes: [
      "Apply Ohm's law and power equations with explicit polarity and current direction to size a resistor for a stated operating point.",
    ],
    concepts: `Voltage is energy difference per unit charge between two nodes. It is always measured relative to a reference: saying a node is “5 V” usually means 5 V above the named ground. Current is the rate of charge flow through a path. Resistance describes how strongly a component opposes current in a regime where the relationship is approximately linear. A useful water analogy is pressure and flow, but wires do not “use up current” and voltage is not a substance stored at a point.

For an ohmic resistor, V = IR. Any form—V = IR, I = V/R, or R = V/I—describes the same relationship with a declared voltage polarity and current direction. Electrical power is P = VI; substituting Ohm's law gives P = I²R or P = V²/R. Power becomes heat, light, motion, sound, or stored energy. A resistor must meet both resistance and power requirements.

Consider an indicator LED on a 5 V controller. If its forward drop is approximately 2 V at the desired 10 mA, the resistor must drop about 3 V. R = 3 V / 0.010 A = 300 Ω, so a nearby 330 Ω standard value gives slightly less current. Its modeled power is I²R, only about 0.03 W, so a common 0.25 W resistor has margin. This resistor choice protects both LED and output pin.

A frequent misconception is that a resistor forces a fixed current regardless of supply or load. It sets current only through the surrounding voltage relationship. Another failure is placing an LED straight across a supply because its “voltage is 2 V”; the LED's nonlinear current can rise destructively. State polarities, estimate component power, and remember that real sources, LEDs, motors, and screens do not all behave as constant resistances.`,
    workedExample: {
      problem: "Choose a series resistor for a red LED modeled with a 1.9 V forward drop, powered from 3.3 V at a target of 6 mA, and calculate resistor power.",
      steps: [
        "Resistor voltage is 3.3 V − 1.9 V = 1.4 V.",
        "Required resistance is 1.4 V / 0.006 A = 233 Ω.",
        "Choose the next common value 240 Ω; modeled current is 1.4 V / 240 Ω = 5.83 mA.",
        "Resistor power is (0.00583 A)^2 × 240 Ω = 0.0082 W.",
      ],
      result: "A 240 Ω resistor gives about 5.8 mA and dissipates roughly 8 mW in this model.",
      sanityCheck: "The current is slightly below target because the selected resistance is slightly higher, and 8 mW is far below a 0.25 W resistor rating.",
    },
    exercise: {
      question: "A 1 kΩ resistor has 5 V across it. What current and resistor power are predicted?",
      choices: ["5 mA and 25 mW", "5 A and 25 W", "0.2 mA and 1 mW", "200 mA and 1 W"],
      answerIndex: 0,
      explanation: "I = 5 V / 1000 Ω = 0.005 A = 5 mA, and P = VI = 5 V × 0.005 A = 0.025 W = 25 mW. The larger answers ignore kilo or milli prefixes; 0.2 mA comes from inverting V/R.",
    },
    lab: {
      goal: "Predict and measure how series resistance changes LED current and brightness.",
      equipment: ["2×AA battery holder", "red LED", "220 Ω resistor", "1 kΩ resistor", "breadboard", "multimeter", "jumper wires"],
      steps: [
        "Measure the unpowered resistor values and record actual readings before assembly.",
        "Build the LED with 1 kΩ in series, then power it and measure supply and resistor voltage in parallel.",
        "Calculate current from measured resistor voltage divided by measured resistance; compare with the expected order of milliamperes.",
        "Remove power, substitute 220 Ω, predict the direction and approximate factor of current change, then measure again.",
        "Deliberately reverse the LED with power removed; repower briefly, diagnose the dark LED from polarity rather than bypassing the resistor, then restore it.",
      ],
      observe: [
        "Expected: 220 Ω produces more current and usually greater brightness than 1 kΩ; actual voltages and calculated currents must be reported.",
        "Expected fault clue: a reversed LED remains dark while supply voltage is present, distinguishing polarity from an absent supply.",
      ],
      transfer: "For a 5 V camera status LED with a stated 2.2 V drop and 4 mA target, select a resistor and check its modeled power.",
      cautions: ["Use only the battery holder and keep a resistor in series with the LED at all times.", "Remove batteries before changing wiring or using resistance mode."],
    },
    projectIds: ["sensor", "cyberdeck"],
    glossary: ["voltage", "current", "resistance", "ohms-law", "electrical-power", "polarity"],
    sources: [MIT_CIRCUITS],
  },
  {
    id: "circuits-kirchhoff",
    track: "electronics",
    title: "Circuits and Kirchhoff's laws",
    summary: "Trace current paths and node voltages to decide how loads should be wired and to localize opens or shorts systematically.",
    minutes: 65,
    level: "Foundation",
    prerequisites: ["voltage-current-resistance", "algebra-trig"],
    outcomes: [
      "Solve a small DC resistor network with Kirchhoff's current and voltage laws and use the result to diagnose a wiring fault.",
    ],
    concepts: `A circuit needs a closed path. Schematics emphasize electrical connections rather than physical layout: every ideal wire joined to a node shares one voltage, and crossing lines are not connected unless the drawing marks a junction. Series components share the same branch current. Parallel components share the same voltage. These statements follow from conservation rather than visual resemblance on a breadboard.

Kirchhoff's current law (KCL) says the algebraic sum of currents at a node is zero: current entering equals current leaving. It expresses charge conservation when the node is not accumulating charge. Kirchhoff's voltage law (KVL) says signed voltage changes around a closed loop sum to zero: energy gained from a source matches energy transferred in components. Choose current arrows and loop directions arbitrarily but keep signs consistent. A negative solved current simply means reality opposes the original arrow.

Series resistances add: R_eq = R1 + R2. For parallel branches, 1/R_eq = Σ1/R_i. A voltage divider uses two series resistors: with output across R2, V_out = V_in R2/(R1+R2), provided the next circuit does not load it significantly. That condition matters when scaling a battery voltage for a sensor input; a low-resistance load changes the ratio.

A frequent misconception is that current is consumed by the first component, leaving less for the second series component. The same steady branch current passes both; their voltage drops differ. Another is assuming two parts drawn beside each other are parallel without checking both endpoints. Label nodes, trace every closed path, and predict measurements before probing. An open circuit often leaves zero branch current but can still leave full supply voltage across the break; that clue is more informative than replacing parts at random.`,
    workedExample: {
      problem: "A 9 V source feeds 1 kΩ and 2 kΩ resistors in series. Find current and the node voltage across the 2 kΩ resistor.",
      steps: [
        "Equivalent resistance is 1 kΩ + 2 kΩ = 3 kΩ.",
        "Loop current is 9 V / 3000 Ω = 0.003 A = 3 mA.",
        "Voltage across 2 kΩ is 3 mA × 2 kΩ = 6 V.",
        "The 1 kΩ drop is 3 V; KVL gives +9 − 3 − 6 = 0 V.",
      ],
      result: "The series current is 3 mA and the divider output across the 2 kΩ resistor is 6 V unloaded.",
      sanityCheck: "The larger resistor receives the larger share of voltage, and the two drops sum exactly to the source voltage.",
    },
    exercise: {
      question: "Two 1 kΩ resistors are connected in parallel across 5 V. What total source current is expected?",
      choices: ["10 mA", "5 mA", "2.5 mA", "0.5 mA"],
      answerIndex: 0,
      explanation: "Each branch draws 5 V / 1 kΩ = 5 mA, so KCL gives 10 mA total. 5 mA counts only one branch. 2.5 mA incorrectly adds parallel resistances as 2 kΩ, and 0.5 mA contains an additional factor-of-ten error.",
    },
    lab: {
      goal: "Verify KCL and use node voltages to distinguish an open branch from a working parallel branch.",
      equipment: ["3×AA battery holder", "two 1 kΩ resistors", "breadboard", "multimeter", "jumper wires"],
      steps: [
        "With batteries removed, build two 1 kΩ branches in parallel and continuity-check the intended common nodes.",
        "Power the circuit and measure source voltage plus the voltage across each branch.",
        "Calculate each branch current from its actual resistance and voltage, then add them for predicted source current without moving the meter to current mode.",
        "Remove power and deliberately open one branch; repower and measure node voltages on both sides of the break to localize it.",
        "Restore the branch and confirm the original voltage pattern.",
      ],
      observe: [
        "Expected: both intact branches have approximately the source voltage; actual computed currents may differ because resistor values and source voltage differ.",
        "Expected fault clue: the intact branch remains powered while current in the open branch is zero; a voltage can appear across the open connection.",
      ],
      transfer: "Draw a two-load diagram for a low-voltage screen and controller that must each receive 5 V, and explain why placing them in series is the wrong decision.",
      cautions: ["Use only the battery holder; remove it before continuity or resistance tests.", "Do not short the supply nodes with a jumper or a meter in current mode."],
    },
    projectIds: ["sensor", "cyberdeck"],
    glossary: ["node", "branch", "kcl", "kvl", "series", "parallel"],
    sources: [MIT_CIRCUITS],
  },
  {
    id: "capacitance-transients",
    track: "electronics",
    title: "Capacitance and transients",
    summary: "Predict first-order charge and discharge behavior to choose a timing or filtering capacitor without mistaking a transient model for an ideal delay.",
    minutes: 65,
    level: "Practice",
    prerequisites: ["circuits-kirchhoff", "rates-integration"],
    outcomes: [
      "Calculate an RC time constant, estimate transient voltages, and diagnose a capacitor polarity, leakage, or connection fault from a measured curve.",
    ],
    concepts: `A capacitor stores separated charge and therefore energy in an electric field. Its defining relation is Q = CV: at a given voltage V, a larger capacitance C stores more charge Q. Current describes how quickly charge changes, so i = C dV/dt. A capacitor's voltage cannot jump instantaneously in the ideal model unless infinite current is available. This makes capacitors useful for smoothing noise, holding a reference briefly, and shaping timing.

In a resistor-capacitor circuit driven by a DC step from 0 to V_s, capacitor voltage is V_C(t) = V_s(1 − e^(−t/RC)). The time constant τ = RC has units Ω·F = s. After one τ, voltage reaches about 63% of its final value; after five τ, it is above 99% in the ideal model. During discharge from V_0 through R, V_C(t) = V_0e^(−t/RC). There is no sharp “finished” instant.

Suppose a sensor input chatters from short glitches. A 10 kΩ resistor with 10 µF gives τ = 0.10 s, which may suppress very brief events but also delays genuine changes. That latency is a build tradeoff, not free filtering. Real capacitors have tolerance, leakage, equivalent series resistance, and voltage limits. Polarized electrolytics must be oriented correctly.

A common misconception is that capacitance blocks all DC immediately. During charging, current flows; after settling in the ideal DC case, it approaches zero. Another failure is reading 100 µF as 100 F or assuming the nominal time constant is an exact measured delay. Use the curve, define a threshold, and account for component tolerance and source/load resistance. The associated RC simulation is a bounded ideal first-order model: it does not include every parasitic or instrument-loading effect.`,
    workedExample: {
      problem: "A 47 kΩ resistor charges a 10 µF capacitor from a 5 V step. Find τ and ideal capacitor voltage after one τ and two τ.",
      steps: [
        "Convert values: 47 kΩ = 47,000 Ω and 10 µF = 10×10^-6 F.",
        "τ = RC = 47,000 × 10×10^-6 s = 0.47 s.",
        "At t = τ, V_C = 5(1 − e^-1) ≈ 3.16 V.",
        "At t = 2τ, V_C = 5(1 − e^-2) ≈ 4.32 V.",
      ],
      result: "The time constant is 0.47 s; ideal voltage is about 3.16 V at 0.47 s and 4.32 V at 0.94 s.",
      sanityCheck: "Both voltages lie between 0 and 5 V, increase with time, and approach rather than exceed the supply.",
    },
    exercise: {
      question: "If R doubles while C and the source stay unchanged, what happens to the ideal RC charging curve?",
      choices: ["The time constant doubles and each voltage fraction takes twice as long", "The final voltage doubles", "The time constant halves", "The capacitor voltage jumps instantly"],
      answerIndex: 0,
      explanation: "τ = RC, so doubling R doubles τ and stretches the time axis. The final ideal DC voltage is still set by the source. Halving τ reverses the proportionality, and an instantaneous voltage jump violates the ideal capacitor relationship.",
    },
    lab: {
      goal: "Compare a measured low-voltage RC charge curve with the ideal time-constant prediction.",
      equipment: ["3×AA battery holder", "47 kΩ resistor", "10 µF electrolytic capacitor rated above 5 V", "multimeter", "breadboard", "timer", "jumper wires"],
      steps: [
        "With power absent, confirm capacitor polarity and build the series resistor-capacitor circuit; calculate τ from measured or nominal values.",
        "Discharge the capacitor through the resistor, then apply the battery and record actual capacitor voltage at 0, 0.5τ, 1τ, 2τ, and 5τ.",
        "Compare readings with ideal expected values and note meter timing and component tolerance.",
        "Remove power, discharge safely, then deliberately move the resistor so the capacitor has no charging path; repower and diagnose the flat or erratic trace as an open-path fault.",
        "Restore the path and repeat one checkpoint.",
      ],
      observe: [
        "Expected ideal values are about 39%, 63%, 86%, and 99% of final voltage at 0.5τ, 1τ, 2τ, and 5τ; actual readings must be kept distinct.",
        "Expected fault clue: an open charging path prevents the smooth rise and may leave a residual voltage determined by leakage and the meter.",
      ],
      transfer: "Choose R or C to target a 50 ms time constant for suppressing a brief button glitch, then state the response delay that choice introduces.",
      cautions: ["Use only the low-voltage battery holder and orient the electrolytic capacitor correctly.", "Remove power and discharge through the resistor before rewiring; never short a charged capacitor directly."],
    },
    projectIds: ["sensor", "cyberdeck"],
    glossary: ["capacitance", "charge", "time-constant", "transient", "exponential", "leakage"],
    sources: [MIT_CIRCUITS],
    simulation: "rc-transient",
  },
  {
    id: "diodes-transistors",
    track: "electronics",
    title: "Diodes and transistors as controlled paths",
    summary: "Use polarity and control conditions to protect a circuit and switch a load that a logic pin should not drive directly.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["circuits-kirchhoff"],
    relatedStudy: ["measurement-instruments"],
    outcomes: [
      "Select the orientation and supporting resistor for a diode or transistor switch and trace current paths in on, off, and fault states.",
    ],
    concepts: `A diode strongly favors current in one direction. In a simple silicon model it conducts forward after its junction voltage becomes substantial and blocks reverse current within its ratings. The familiar fixed-drop model—perhaps 0.7 V for a silicon diode or a color-dependent LED drop—is useful for first calculations but is not a law. Current changes steeply with voltage, temperature matters, and ratings limit reverse voltage and power.

A transistor uses a small control signal to influence a larger load current. For an N-channel enhancement MOSFET used as a low-side switch, the load connects from positive supply to drain, source goes to ground, and a sufficiently positive gate-to-source voltage turns the channel on. A gate resistor can limit switching spikes, while a pull-down holds the gate off during reset. “Threshold voltage” does not mean fully on; use on-resistance specifications at the actual logic drive when selecting hardware.

Inductive loads such as relays and DC motors resist abrupt current change. When a transistor opens, the winding can produce a large voltage. A flyback diode across a one-direction DC winding provides a decay path, normally reverse-biased while powered. Its orientation is a deliberate protection decision: backwards during normal operation, forward-conducting during turn-off.

A common misconception is that a transistor automatically supplies current; it controls a path whose current still comes from the load supply. Another is driving a fan or printer motor directly from a microcontroller pin because its rated voltage matches. Pin current and transient energy can exceed limits even at 3.3 V. Trace load and control loops separately, share ground when the interface requires it, and verify device pinout—gate, drain, source order is not universal.`,
    workedExample: {
      problem: "A 3.3 V GPIO drives an NPN transistor base for a 60 mA load. Assume forced gain of 10 and base-emitter drop 0.8 V. Choose a base resistor.",
      steps: [
        "Required base current is 60 mA / 10 = 6 mA.",
        "Resistor voltage is 3.3 V − 0.8 V = 2.5 V.",
        "R = 2.5 V / 0.006 A = 417 Ω.",
        "Choose 390 Ω; modeled base current is 2.5 V / 390 Ω = 6.4 mA, exceeding the 6 mA target. Confirm that the GPIO can supply this current at the assumed output voltage.",
      ],
      result: "A 390 Ω base resistor gives a forced gain below 10 in this model, subject to verifying GPIO output voltage/current and transistor saturation ratings.",
      sanityCheck: "The resistor prevents the base from looking like a near-short, and its current is an order of magnitude below the 60 mA load current.",
    },
    exercise: {
      question: "Why is a flyback diode placed across a DC motor winding with opposite polarity during normal operation?",
      choices: ["So it is off normally but carries winding current safely after switch-off", "So it shorts the supply whenever the motor runs", "To raise the motor's normal voltage", "To make GPIO current power the motor"],
      answerIndex: 0,
      explanation: "The reverse-biased diode does not conduct during normal drive. When switch-off reverses the winding voltage, it becomes forward-biased and provides a current-decay loop. Forward-biasing it normally would short the supply; it neither boosts voltage nor moves load power to GPIO.",
    },
    lab: {
      goal: "Operate an LED load with a transistor switch and diagnose control-path versus load-path faults.",
      equipment: ["3×AA battery holder", "logic-level N-channel MOSFET suitable at the available gate voltage", "LED", "330 Ω resistor", "10 kΩ pull-down", "breadboard", "multimeter", "jumper wires"],
      steps: [
        "With power removed, verify the MOSFET pinout from its trusted part documentation and build the LED-resistor load from positive supply to drain, source to ground.",
        "Add the 10 kΩ gate-to-ground pull-down; predict LED state with gate at ground and at battery positive.",
        "Power the circuit and use a jumper as the low-voltage control; measure gate-to-source and drain-to-source voltage in each state.",
        "Remove power and deliberately disconnect the gate pull-down; repower without touching the gate and diagnose any unstable or retained state as a floating-control fault.",
        "Restore the pull-down and confirm deterministic off behavior.",
      ],
      observe: [
        "Expected: high gate drive turns the LED on and reduces drain-to-source voltage; actual values depend on the device and must be recorded.",
        "Expected fault clue: without the pull-down, stored gate charge or pickup can make the state unreliable even though the load path is intact.",
      ],
      transfer: "Draw the current path and flyback diode orientation for a small one-direction low-voltage fan switched by a transistor; list ratings that still require verification.",
      cautions: ["Use an LED as the lab load, not a mains appliance or unknown motor.", "Remove power before rewiring and do not exceed the MOSFET, LED, resistor, or battery-holder ratings."],
    },
    projectIds: ["sensor", "desk-robot"],
    glossary: ["diode", "transistor", "mosfet", "flyback-diode", "gate", "saturation"],
    sources: [MIT_CIRCUITS],
  },
  {
    id: "power-regulation",
    track: "electronics",
    title: "Power budgets and voltage regulation",
    summary: "Build a worst-case rail budget and choose a regulator topology with enough current, voltage, and thermal margin for the controller, screen, and sensors.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["voltage-current-resistance"],
    relatedStudy: ["circuits-kirchhoff", "diodes-transistors"],
    outcomes: [
      "Calculate source, rail, and regulator limits for multiple loads and identify dropout, efficiency, or heating as the binding constraint.",
    ],
    concepts: `A power system must deliver the right voltage while supplying the sum of load currents in both steady and transient conditions. Start with a rail table: each load's voltage, typical current, credible peak current, duty cycle, and uncertainty. Parallel loads on a 5 V rail share voltage, so their currents add. A controller drawing 80 mA, screen drawing 300 mA, and sensor drawing 20 mA require 400 mA typical before margin; a radio or backlight surge may set the actual requirement.

A linear regulator discards excess voltage as heat. Its approximate dissipation is P_loss = (V_in − V_out)I_load, and efficiency is roughly V_out/V_in when its own current is small. It is simple and can be quiet, but dropping 12 V to 5 V at 0.4 A wastes 2.8 W—often too hot without thermal design. A switching regulator transfers energy through controlled switching and can be far more efficient, but introduces ripple, layout sensitivity, and operating limits. Neither topology is simply “better.”

Regulators also need headroom. A linear regulator falls out of regulation when input voltage approaches output plus dropout voltage. Switching converters have input ranges, maximum currents, thermal derating, and minimum support-component requirements. Source wires and connectors add voltage drop. For a cyberdeck screen, choosing a 1 A-rated 5 V module for a calculated 0.75 A peak leaves modest current margin, but rating, cooling, startup, and cable drop still require bench verification.

A common misconception is that a load is forced to consume the full current printed on a supply. The rating is a maximum capability; the load draws according to its behavior. Another is summing watts from different rails without accounting for conversion efficiency. Budget each rail, convert back to source power using an efficiency assumption, and expose simultaneous worst cases. The power-budget simulation is a bounded arithmetic model, not thermal certification or a substitute for regulator documentation.`,
    workedExample: {
      problem: "A 5 V rail supplies a 350 mA screen, 120 mA controller, and 60 mA sensor. A buck converter is modeled at 85% efficiency from 9 V. Find output power and input current, then assess a 700 mA output rating.",
      steps: [
        "Sum load current: 0.350 + 0.120 + 0.060 = 0.530 A.",
        "Output power is 5 V × 0.530 A = 2.65 W.",
        "Input power is 2.65 W / 0.85 = 3.12 W.",
        "Input current is 3.12 W / 9 V = 0.347 A; output current margin is 0.700 − 0.530 = 0.170 A.",
      ],
      result: "The modeled source current is 347 mA, and the converter has 170 mA of output-current margin before considering peaks and derating.",
      sanityCheck: "Input current is lower than output current because input voltage is higher, while input power exceeds output power due to losses.",
    },
    exercise: {
      question: "A linear regulator makes 5 V at 0.4 A from 9 V. Approximately how much power becomes heat in the regulator?",
      choices: ["1.6 W", "2.0 W", "3.6 W", "0.4 W"],
      answerIndex: 0,
      explanation: "Loss is (9 − 5) V × 0.4 A = 1.6 W. 2.0 W is output power, 3.6 W is input power, and 0.4 W treats the current number as a wattage. Thermal viability still depends on package and ambient conditions.",
    },
    lab: {
      goal: "Construct and validate a low-voltage load budget against observed USB supply behavior.",
      equipment: ["5 V USB power bank", "USB inline voltage/current meter", "USB LED light", "5 V USB fan", "individually switched USB hub or one-load-at-a-time adapter", "notes sheet"],
      steps: [
        "Record label current or power for each load and predict individual plus simultaneous current, marking labels as limits rather than measured draw.",
        "Connect one load at a time through the inline meter and record actual steady voltage and current.",
        "If the hub is designed for both loads, connect both and compare actual total with the sum of individual measurements and supply rating.",
        "Deliberately introduce a known thin or long USB extension if available and intact; diagnose voltage drop by comparing source-side and load-side behavior without opening cables.",
        "Remove the extension and verify recovery, then state a current margin decision for the hypothetical screen-and-fan build.",
      ],
      observe: [
        "Expected: combined current is near the sum of individual currents but can vary with fan startup or regulated loads; preserve actual readings separately.",
        "Expected fault clue: added cable resistance can lower load voltage or cause reset while source capability remains unchanged.",
      ],
      transfer: "Create a worst-case 5 V rail table for a camera, processor, and two sensors, then specify the minimum converter rating and explicit margin assumption.",
      cautions: ["Use only intact low-voltage USB accessories within their printed ratings; do not open chargers or power banks.", "Stop if a connector or cable becomes warm, discolored, or intermittent."],
    },
    projectIds: ["cyberdeck", "desk-robot"],
    glossary: ["power-budget", "regulator", "efficiency", "dropout-voltage", "thermal-margin", "rail"],
    sources: [MIT_CIRCUITS],
    simulation: "power-budget",
  },
  {
    id: "batteries-protection",
    track: "electronics",
    title: "Batteries, energy, and protection",
    summary: "Estimate runtime while respecting chemistry, protection, peak current, and cutoff constraints instead of choosing a pack from capacity alone.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["power-regulation"],
    relatedStudy: ["experimental-method"],
    outcomes: [
      "Compare low-voltage battery options using energy and current requirements, and explain the roles of charging, cutoff, and fault protection.",
    ],
    concepts: `A battery converts stored chemical energy into electrical energy. Voltage depends on chemistry, cell count, charge state, temperature, and load. Capacity in ampere-hours describes charge, not energy by itself. A useful first energy estimate is E ≈ V_nominal × capacity in Ah, expressed in watt-hours. Two packs with the same ampere-hour number but different voltages do not store the same energy.

Runtime is not simply the label divided by current when converters and changing loads are involved. Estimate load energy, include conversion efficiency, and check peak current separately. A 3.7 V nominal, 2 Ah lithium-ion pack holds about 7.4 Wh by this approximation. If a regulated system consumes 3 W and averages 85% conversion efficiency, modeled runtime is 7.4 Wh × 0.85 / 3 W ≈ 2.1 h. Real capacity, cutoff, aging, temperature, and duty cycle alter the result.

Lithium-ion and lithium-polymer cells require compatible charge control and protection against overcharge, over-discharge, short circuit, and excessive current. A protection board is not automatically a complete charger, and neither makes an unknown cell safe. Mechanical damage, swelling, heat, or a dubious source are stop conditions. For a desk robot, an enclosed protected pack or a reputable USB power bank is often a better introductory choice than loose pouch cells.

A common misconception is that cells may be placed in parallel merely because their labels match. Differences in voltage, age, and internal resistance can cause large equalization currents; pack construction needs suitable matched cells and engineering controls. Another is assuming a fuse protects against every battery hazard. Protection layers address different faults. Select a source only after checking voltage range, continuous and startup current, energy, connector polarity, charger compatibility, mounting, and end-of-discharge behavior. The power-budget model remains an estimate, not battery certification.`,
    workedExample: {
      problem: "A protected 7.4 V nominal, 2.5 Ah pack powers a robot averaging 8 W through a converter at 88% efficiency. Estimate energy delivered to loads and runtime.",
      steps: [
        "Nominal pack energy is 7.4 V × 2.5 Ah = 18.5 Wh.",
        "Modeled delivered energy is 18.5 Wh × 0.88 = 16.28 Wh.",
        "Runtime is 16.28 Wh / 8 W = 2.04 h.",
        "Treat 2.04 h as a planning estimate before cutoff, peak-current, temperature, and aging tests.",
      ],
      result: "The simple model predicts about 16.3 Wh delivered and roughly 2.0 h runtime.",
      sanityCheck: "At perfect efficiency runtime would be 18.5/8 = 2.31 h, so the loss-adjusted result must be lower.",
    },
    exercise: {
      question: "Which statement best explains why a 3 Ah battery might still fail to start a motor?",
      choices: ["Capacity does not guarantee the required peak current without excessive voltage sag or protection cutoff", "Ampere-hours are exactly the same as amperes", "A larger capacity always means lower voltage", "Motor startup consumes no current"],
      answerIndex: 0,
      explanation: "Ampere-hours measure charge capacity, while startup requires an instantaneous current capability shaped by internal resistance and protection limits. Capacity and current rating are related design data, not interchangeable. Larger capacity does not inherently lower voltage, and stalled motors commonly draw their highest current.",
    },
    lab: {
      goal: "Compare label-based runtime estimates with a safe external discharge observation from a protected USB power bank.",
      equipment: ["intact USB power bank", "USB inline energy meter", "USB LED light or fan", "timer", "manufacturer label or documentation", "notes sheet"],
      steps: [
        "Record advertised capacity, the voltage basis if stated, output rating, and every conversion assumption; do not open the pack.",
        "Measure actual output voltage, current, and power for ten minutes with the chosen load and calculate energy from average power × elapsed hours.",
        "Extrapolate runtime as an explicitly provisional estimate and compare it with a label-based watt-hour estimate.",
        "Deliberately disconnect and loosely reconnect only the external USB load cable to create a visible open-circuit fault; diagnose zero load current while pack voltage may remain available.",
        "Reconnect firmly and confirm current returns; document any automatic shutoff behavior as an observation, not a defect assumption.",
      ],
      observe: [
        "Expected: meter energy increases approximately with elapsed time under a steady load; actual power and any drift must be recorded.",
        "Expected fault clue: an open external load produces near-zero current, which is distinct from an empty pack or low-voltage cutoff.",
      ],
      transfer: "Compare a reputable USB power bank and a protected rechargeable pack for a camera robot using voltage, peak current, energy, charging workflow, mounting, and fault containment.",
      cautions: ["Do not open, puncture, bend, short, modify, or bypass protection on any cell or power bank.", "Stop using and isolate from combustibles according to manufacturer guidance if a battery is swollen, damaged, leaking, unusually hot, or odorous; do not perform the lab with it."],
    },
    projectIds: ["desk-robot", "cyberdeck"],
    glossary: ["battery-capacity", "watt-hour", "internal-resistance", "cutoff", "charge-controller", "protection-circuit"],
    sources: [LIPO_GUIDE],
    simulation: "power-budget",
  },
  {
    id: "digital-interfaces",
    track: "electronics",
    title: "Digital levels and wired interfaces",
    summary: "Treat logic as voltage ranges plus timing and shared references so a sensor connection survives mismatched levels and missing pull resistors.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["voltage-current-resistance"],
    relatedStudy: ["circuits-kirchhoff", "diodes-transistors"],
    outcomes: [
      "Trace a basic push-pull or open-drain digital connection, select a pull-up, and identify voltage-level or ground-reference incompatibility before wiring.",
    ],
    concepts: `Digital signals are physical voltages interpreted as states. A receiver usually defines a low range, a high range, and an undefined region between them. “3.3 V logic” does not guarantee compatibility with every 5 V device: compare the sender's guaranteed output levels, receiver thresholds, and absolute maximum ratings. Grounds usually need a shared reference so both devices mean the same voltage, unless an intentionally isolated interface is used.

A push-pull output actively drives both high and low. An open-drain output actively pulls low but relies on a pull-up resistor to create high. The pull-up and bus capacitance form an RC rise, so a smaller resistance rises faster but draws more current when low. At 3.3 V with 4.7 kΩ, low-state pull-up current is about 0.70 mA. This is why interfaces such as I²C can share a line without multiple outputs fighting high against low—provided devices follow the protocol and levels are compatible.

Timing gives bits meaning. A clocked interface coordinates sampling with a clock; an asynchronous interface such as UART relies on an agreed bit rate and frame. A logic analyzer can show transitions, but voltage compatibility must be established before connection. For a camera or environmental sensor, the build decision may be to pull an open-drain bus to 3.3 V rather than 5 V because the controller input is not 5 V tolerant.

A common misconception is that a logic high always equals exactly the supply voltage. It is a valid range under specified load. Another is adding pull-ups blindly when a breakout already includes them, making the effective resistance lower. Missing common ground often produces erratic data that resembles software failure. Before debugging code, document signal direction, idle state, reference ground, pull resistors, voltage limits, connector pinout, and timing.`,
    workedExample: {
      problem: "An open-drain line uses a 3.3 V pull-up and has estimated bus capacitance 100 pF. Compare 10 kΩ and 2.2 kΩ pull-ups using τ = RC and low-state current V/R.",
      steps: [
        "For 10 kΩ, τ = 10,000 Ω × 100 pF = 1.0 µs; low current is 3.3 V / 10 kΩ = 0.33 mA.",
        "For 2.2 kΩ, τ = 2,200 Ω × 100 pF = 0.22 µs; low current is 3.3 V / 2.2 kΩ = 1.5 mA.",
        "The smaller resistor improves ideal rise time by about 4.5× but draws about 4.5× more low-state current.",
      ],
      result: "2.2 kΩ is faster but costs more sink current; selection must satisfy both timing and device current limits.",
      sanityCheck: "Because both τ and 1/current scale with resistance here, lowering resistance must shorten τ while increasing current.",
    },
    exercise: {
      question: "A 3.3 V controller receives an open-drain sensor signal. The sensor tolerates 3.3 V. Where should the pull-up normally connect?",
      choices: ["To the compatible 3.3 V rail", "To 5 V because digital means either voltage is safe", "To ground", "In series between the two ground pins"],
      answerIndex: 0,
      explanation: "The pull-up establishes the high level, so connecting it to a mutually compatible 3.3 V rail protects the controller input. A 5 V pull-up can violate input limits. Ground would hold the line low, and placing a resistor between grounds does not create the required high state.",
    },
    lab: {
      goal: "Observe how a pull-up turns an open-switch node into a defined digital input and diagnose a floating line.",
      equipment: ["3×AA battery holder", "10 kΩ resistor", "momentary pushbutton", "breadboard", "multimeter", "jumper wires"],
      steps: [
        "Build a node pulled to battery positive through 10 kΩ, with the button connecting the node to ground; predict released and pressed voltages.",
        "Power the circuit and record actual node voltage in both states plus current predicted through the pull-up when pressed.",
        "Remove power, deliberately disconnect the pull-up, repower, and measure the released node several times while moving your hand nearby without touching conductors.",
        "Diagnose unstable or arbitrary readings as a floating-input condition rather than a valid high.",
        "Restore the pull-up and verify repeatable states; calculate whether the low-state current is within the resistor power limit.",
      ],
      observe: [
        "Expected: released voltage is near the supply and pressed voltage near ground; actual values and meter resolution should be recorded.",
        "Expected fault clue: with no pull-up and an open button, the node lacks a defined DC path and may not settle reproducibly.",
      ],
      transfer: "Audit a hypothetical 5 V sensor-to-3.3 V controller link by listing thresholds and absolute limits needed before choosing a divider, level shifter, or direct wire.",
      cautions: ["Use only the battery holder and confirm its voltage is within the components' ratings.", "Power down before moving jumpers; never assume a named protocol guarantees electrical compatibility."],
    },
    projectIds: ["sensor", "cyberdeck"],
    glossary: ["logic-level", "threshold", "open-drain", "pull-up", "bus-capacitance", "common-ground"],
    sources: [MIT_CIRCUITS, MICRO_PYTHON_RP2],
    simulation: "gpio-state-machine",
  },
  {
    id: "motor-drivers",
    track: "electronics",
    title: "Motor drivers and inductive loads",
    summary: "Match a driver, supply, and protection path to motor stall current, direction, and braking behavior before powering a toy-car or blower mechanism.",
    minutes: 75,
    level: "Practice",
    prerequisites: ["diodes-transistors", "power-regulation", "digital-interfaces"],
    relatedStudy: ["batteries-protection"],
    outcomes: [
      "Specify a low-voltage DC motor driver from stall current and control requirements, then diagnose supply, control, or load-path faults from measurements.",
    ],
    concepts: `A DC motor converts electrical input into torque and motion. Its winding has resistance and inductance, while rotation generates back electromotive force that opposes the supply. At startup or stall, speed and back-EMF are near zero, so current is limited mainly by winding resistance and the driver. That stall current can be several times the free-running current and is the first electrical number to check.

A single low-side transistor controls one direction. An H-bridge uses four switching paths to apply either polarity across the motor, allowing forward and reverse. Some switch combinations coast the motor by opening its current path; others brake by providing a low-resistance path that dissipates motion. Shoot-through—turning on the high and low switch of the same bridge leg together—shorts the supply, so driver logic inserts safe switching behavior. Integrated drivers add flyback paths, current limiting, and thermal protection, but their current ratings and voltage drops still matter.

Pulse-width modulation (PWM) rapidly switches drive on and off. Duty cycle changes average applied voltage in a simplified model, but motor current, torque ripple, switching loss, and audible noise depend on inductance and frequency. For a toy car, choosing a driver above the measured or specified stall current with realistic thermal margin is more important than matching only free-run current. A vacuum-blower analogue may need one direction but a much larger startup budget.

A common misconception is that the motor draws only what the software commands. The mechanical load and electrical path determine current; a jam can force stall current at any duty cycle. Another failure is powering motor and logic from separate sources without the required common reference, or allowing motor noise to reset the controller. Separate the power path from control signals, place local decoupling as recommended by the driver manufacturer, keep high-current loops short, and test with current limiting. The DC-motor simulation is a bounded linear model, not a winding-temperature or driver-safety guarantee.`,
    workedExample: {
      problem: "A 6 V motor has 3 Ω winding resistance. A driver adds 0.6 Ω total path resistance. Estimate stall current and driver conduction loss if its resistance accounts for the 0.6 Ω.",
      steps: [
        "At stall, model back-EMF as zero and total resistance as 3.0 + 0.6 = 3.6 Ω.",
        "Stall current is 6 V / 3.6 Ω = 1.67 A.",
        "Driver conduction loss is I²R = (1.67 A)^2 × 0.6 Ω ≈ 1.67 W.",
        "The motor receives about 5.0 V because driver drop is 1.67 A × 0.6 Ω ≈ 1.0 V.",
      ],
      result: "The simple stall model predicts 1.67 A and about 1.67 W dissipated in the driver path—large enough to make thermal limits central.",
      sanityCheck: "Motor plus driver voltage drops are about 5.0 V + 1.0 V = 6.0 V, and current is lower than the 2 A predicted if driver resistance were ignored.",
    },
    exercise: {
      question: "A motor runs freely at 200 mA but its datasheet gives 1.8 A stall current. Which value should dominate minimum driver peak-current selection?",
      choices: ["The 1.8 A stall current, with suitable duration and thermal margin", "The 200 mA free-run current only", "The arithmetic average, 1.0 A", "Neither; motor current is set entirely by PWM code"],
      answerIndex: 0,
      explanation: "Startup, jams, and reversals can approach stall current, so the driver and source must tolerate that credible peak under stated duration and cooling conditions. Free-run current understates the stress; averaging unrelated operating points has no physical basis; PWM does not override winding and load physics.",
    },
    lab: {
      goal: "Characterize direction, startup voltage sag, and a deliberate control fault using a protected low-voltage motor-driver setup.",
      equipment: ["3–6 V small DC motor with documented current limits", "compatible integrated motor-driver board rated above stall current", "current-limited low-voltage bench supply or protected battery holder", "multimeter", "switches or logic jumpers", "light paper flag", "driver documentation"],
      steps: [
        "With power off, verify driver pinout, motor voltage range, stall-current compatibility, and shared ground; attach only a light paper flag for direction visibility.",
        "Set a conservative current limit if using a bench supply, command coast, then power logic and motor supply in the documented sequence.",
        "Command forward briefly and record actual supply voltage before and during startup plus running current; repeat reverse after the motor stops.",
        "Power down. Only if the driver documents a pull-up or pull-down establishing a known input level, disconnect that direction-control signal and predict the result from the truth table. Otherwise keep the input connected and impose a documented safe logic level with the switch or resistor arrangement; never leave an undocumented input floating. Repower briefly and compare the result with the prediction.",
        "Restore the input and verify both directions without mechanically stalling the shaft.",
      ],
      observe: [
        "Expected: startup current exceeds unloaded running current and supply voltage may dip; actual peak may be missed by a slow meter and must be labeled accordingly.",
        "Expected fault clue: the deliberately imposed, known input level gives the documented coast, brake, or direction state. A floating input has no guaranteed state; the truth table alone does not define it.",
      ],
      transfer: "Specify a driver for a two-motor toy car from voltage, per-motor stall current, simultaneous direction changes, braking need, logic voltage, and source peak capability.",
      cautions: ["Use only a documented low-voltage motor and driver with guarded or lightweight attachments; keep hair, fingers, and wires away from rotation.", "Do not stall the motor by hand, reverse it while spinning, or probe mains-powered appliances such as a vacuum cleaner or printer."],
    },
    projectIds: ["desk-robot", "linkage"],
    glossary: ["dc-motor", "h-bridge", "stall-current", "back-emf", "pwm", "braking"],
    sources: [MIT_CIRCUITS, MICRO_PYTHON_RP2],
    simulation: "dc-motor",
  },
];
