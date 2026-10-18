import type { LearningModule, LearningSource } from "./types";

const micropython: LearningSource = {
  title: "MicroPython RP2 quick reference",
  url: "https://docs.micropython.org/en/latest/rp2/quickref.html",
};
const blinkWithoutDelay: LearningSource = {
  title: "Arduino Blink Without Delay",
  url: "https://docs.arduino.cc/built-in-examples/digital/BlinkWithoutDelay/",
};
const missingSemester: LearningSource = {
  title: "MIT The Missing Semester of Your CS Education",
  url: "https://missing.csail.mit.edu/",
};
const circuits: LearningSource = {
  title: "MIT OpenCourseWare 6.002 Circuits and Electronics",
  url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
};
const bme280: LearningSource = {
  title: "CircuitPython BME280 examples",
  url: "https://docs.circuitpython.org/projects/bme280/en/latest/examples.html",
};
const modernRobotics: LearningSource = {
  title: "Modern Robotics",
  url: "https://modernrobotics.northwestern.edu/",
};
const controlTutorials: LearningSource = {
  title: "Control Tutorials for MATLAB and Simulink",
  url: "https://ctms.engin.umich.edu/CTMS/",
};
const designCourse: LearningSource = {
  title: "MIT OpenCourseWare 2.007 Design and Manufacturing I",
  url: "https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/pages/syllabus/",
};
const continuityGuide: LearningSource = {
  title: "Adafruit multimeter continuity guide",
  url: "https://learn.adafruit.com/multimeters/continuity",
};

export const embeddedRoboticsModules: LearningModule[] = [
  {
    id: "programming-state",
    track: "embedded",
    title: "Programs as state-changing machines",
    summary: "Model firmware as explicit state transitions, then choose states that keep a desk robot responsive while it waits, moves, or reports a fault.",
    minutes: 50,
    level: "Foundation",
    prerequisites: ["engineering-workflow"],
    outcomes: [
      "Trace state variables through a timed input sequence and design a non-blocking finite-state machine with an explicit safe state.",
    ],
    concepts: `A program inside a product is less like a written recipe and more like a board-game position. At any instant, variables remember the position: whether a button was previously down, when a motor started, or which screen page is visible. Incoming events change that remembered state. A toy car may be IDLE, DRIVING, or FAULT; the same button press means “start” in IDLE and “stop” in DRIVING.

Formally, a finite-state machine can be written as next_state = F(current_state, input). Outputs may depend only on state, or on state and input. Time becomes an input when firmware compares a monotonic clock with a saved deadline. A transition table makes the contract inspectable: for every state and relevant event, name the next state and output. This is preferable to scattered Boolean flags, where impossible combinations such as moving = true and faulted = true can arise.

Blocking delays hide inputs while the processor waits. A non-blocking loop instead samples inputs, updates state, sets outputs, and returns quickly. For a desk robot, choosing a separate FAULT state is a build decision: motor commands become zero from one auditable branch rather than from several hoped-for checks. Entry actions run once when a state changes; continuous actions run every pass while it remains active.

A common misconception is that more states always mean needless complexity. Too few states can conceal distinct obligations such as “motor stopping” versus “motor stopped.” The opposite failure is encoding every sensor value as a state. Keep durable operating modes as states and transient measurements as data. Trace events on paper before coding; an unhandled event is a design gap, not merely a syntax problem. The associated simulator is a bounded behavioral state model, not MCU or electrical emulation.`,
    workedExample: {
      problem: "A status LED must be ON for 300 ms after a button press while the loop runs every 20 ms. Trace a non-blocking two-state design when presses arrive at 100 ms and 260 ms.",
      steps: [
        "At 100 ms, transition IDLE → LIT and set deadline = 100 ms + 300 ms = 400 ms.",
        "At 260 ms, define the LIT + press transition to remain LIT and refresh deadline to 560 ms.",
        "Checks at 400, 420, …, 540 ms keep the LED on because now < 560 ms; the 560 ms check transitions to IDLE and turns it off.",
      ],
      result: "The LED is on from 100 ms through the check before 560 ms, so the second press extends the visible interval without pausing input handling.",
      sanityCheck: "The final deadline is exactly 300 ms after the latest press, and the 20 ms loop quantizes turn-off by at most one loop period.",
    },
    exercise: {
      question: "A robot has IDLE, MOVING, and FAULT states. While MOVING it detects overcurrent. Which transition is safest and easiest to audit?",
      choices: [
        "Set a fault flag but remain MOVING until the current falls",
        "Transition immediately to FAULT, command zero motor output, and require an explicit reset condition",
        "Call a 5-second delay and then return to IDLE",
        "Toggle between MOVING and IDLE on every loop pass",
      ],
      answerIndex: 1,
      explanation: "An explicit FAULT transition centralizes the safe output and recovery rule. A flag while remaining MOVING permits other MOVING logic to keep issuing drive commands. A blocking delay prevents observation and cannot establish that the cause disappeared. Rapid toggling is not recovery; it creates unpredictable output and loses the meaning of state.",
    },
    lab: {
      goal: "Implement and trace a three-state button-controlled LED machine without blocking delays.",
      equipment: ["3.3 V microcontroller board", "on-board LED or LED with calculated series resistor", "momentary button or safe jumper", "USB data cable", "serial console"],
      steps: [
        "Write a transition table for OFF, ON_TIMED, and FAULT before writing code.",
        "Poll the button and monotonic milliseconds; print timestamp, input, old state, and new state only on transitions.",
        "Make a press enter ON_TIMED for 1 s and a second press refresh its deadline.",
        "Introduce a deliberate logical fault by temporarily omitting the refresh transition; reproduce it from the trace, then restore the transition.",
        "Add a long press that enters FAULT with the LED off, and define a release-plus-new-press recovery.",
      ],
      observe: [
        "Expected: normal loop activity continues during the one-second interval and the second press moves the deadline.",
        "Record actual transition timestamps and compare each interval with 1.00 s; do not report expected timing as a measurement.",
        "Expected fault signature: with the refresh transition omitted, the state still returns to OFF at the first deadline despite the second press.",
      ],
      transfer: "Sketch the states and transition guards for a small screen that alternates between a menu, a live sensor view, and a recoverable sensor-error page.",
      cautions: ["Use only board-level 3.3 V/5 V hardware; calculate an external LED resistor and never connect an LED directly across the supply."],
    },
    projectIds: ["desk-robot", "cyberdeck"],
    glossary: ["state-machine", "transition", "event", "deadline", "blocking"],
    sources: [micropython, blinkWithoutDelay],
    simulation: "gpio-state-machine",
  },
  {
    id: "data-structures",
    track: "embedded",
    title: "Data structures under tight limits",
    summary: "Choose records, queues, and ring buffers by access pattern and memory cost so sensor history fits without unpredictable allocation.",
    minutes: 55,
    level: "Foundation",
    prerequisites: ["programming-state"],
    relatedStudy: ["measurement-instruments"],
    outcomes: [
      "Select and size a fixed-capacity representation for sampled data, commands, and device state, including overflow behavior.",
    ],
    concepts: `A data structure is a promise about how information is organized and what operations will be cheap. A labeled record groups one sensor sample’s time, value, and status. A queue preserves arrival order for commands. A ring buffer stores only the newest fixed number of samples by wrapping back to its first slot, much like a security camera overwriting its oldest footage.

On a microcontroller, capacity is an engineering quantity. If each sample contains a 32-bit timestamp, a 16-bit reading, and a 16-bit status field, its payload is 8 bytes. N samples therefore require at least 8N bytes, possibly more because of alignment or language-object overhead. A fixed packed buffer can make this cost predictable; a list of dynamic objects may cost several times the payload and can fragment a small heap. Measure on the chosen runtime rather than assuming desktop costs.

Access patterns determine the build decision. A screen plot needs recent samples in chronological order, so a ring buffer is suitable. A command mailbox that must never silently discard an emergency stop needs a bounded queue with an explicit full policy, perhaps reserving one high-priority flag outside the queue. Index update is write_index = (write_index + 1) mod capacity. When full, overwriting is acceptable only if “newest history wins” is part of the requirement.

A frequent misconception is that arrays are primitive and therefore always fastest or safest. An array with ambiguous positions—item[3] means temperature today but flags tomorrow—invites unit and field mistakes. Conversely, nested general-purpose objects can hide memory cost. Name fields at boundaries, use compact representations where measurements justify them, and document units and overflow behavior. Silent overwrite, unbounded growth, and mixing raw counts with converted units are data-design failures, not storage trivia.`,
    workedExample: {
      problem: "A controller has 12 KiB available for logging. Each packed sample uses 4 bytes for milliseconds, 2 bytes for ADC counts, and 2 bytes for flags. At 50 samples/s, how much history fits if 2 KiB is reserved?",
      steps: [
        "Usable logging memory = 12 KiB - 2 KiB = 10 × 1024 = 10,240 bytes.",
        "Sample size = 4 + 2 + 2 = 8 bytes, so capacity = floor(10,240 / 8) = 1,280 samples.",
        "History duration = 1,280 samples / 50 samples/s = 25.6 s.",
      ],
      result: "A 1,280-entry packed ring buffer retains 25.6 seconds of history before overwriting the oldest sample.",
      sanityCheck: "50 samples/s × 25.6 s × 8 bytes/sample = 10,240 bytes, exactly the allocated capacity before runtime overhead outside the packed buffer.",
    },
    exercise: {
      question: "A 32-entry command queue is full when a new ordinary motion command arrives. The specification says commands must execute in order and none may be lost. What is the correct design response?",
      choices: [
        "Overwrite the oldest entry because ring buffers always discard old data",
        "Overwrite the newest entry and report success",
        "Reject or back-pressure the producer and expose a queue-full status",
        "Allocate memory forever until the command fits",
      ],
      answerIndex: 2,
      explanation: "If loss is forbidden, full capacity must become visible so the producer can retry or slow down. Overwriting either end violates the ordering/completeness contract. Unbounded allocation merely postpones failure and is especially risky on a small heap. Ring storage and overwrite policy are separate decisions.",
    },
    lab: {
      goal: "Build a fixed eight-sample ring buffer and prove its ordering and overflow behavior from a trace.",
      equipment: ["Microcontroller or desktop Python environment", "serial console or terminal", "potentiometer or generated integer sequence", "notebook"],
      steps: [
        "Represent each sample with a sequence number, raw value, and validity flag; state the units of each field.",
        "Insert values 0 through 11 into capacity 8 while printing the write index after each insertion.",
        "Read the retained entries oldest-to-newest and verify that sequence numbers 4 through 11 remain.",
        "Introduce a deliberate fault by removing the modulo operation; capture the out-of-range error or corrupted ordering, then restore it.",
        "Repeat with a queue-full policy that rejects the ninth item instead of overwriting it and compare the contracts.",
      ],
      observe: [
        "Expected: the write index repeats 0 after 7, and overwrite mode retains the newest eight sequence numbers.",
        "Record actual printed indices and retained values; if the runtime reports object memory, record it separately from the 8-byte packed estimate.",
        "Expected fault signature: without modulo, the ninth write targets index 8 rather than wrapping to 0.",
      ],
      transfer: "Choose a representation and full policy for storing the last 60 fan-speed estimates while guaranteeing that a stop request cannot be overwritten.",
      cautions: ["If using a potentiometer, connect it only between the board’s documented logic supply and ground; its wiper must stay within the ADC input range."],
    },
    projectIds: ["sensor", "cyberdeck"],
    glossary: ["record", "queue", "ring-buffer", "capacity", "overflow"],
    sources: [missingSemester, micropython],
  },
  {
    id: "mcu-gpio",
    track: "embedded",
    title: "Microcontrollers and GPIO boundaries",
    summary: "Configure digital pins deliberately and choose pull resistors and interface circuitry that prevent floating inputs or overloaded outputs.",
    minutes: 60,
    level: "Practice",
    prerequisites: ["programming-state", "voltage-current-resistance", "digital-interfaces"],
    outcomes: [
      "Wire and configure a low-voltage digital input/output, calculate its load current, and diagnose floating, inverted, and overcurrent-prone designs.",
    ],
    concepts: `A microcontroller is a small computer surrounded by pins that meet the physical world. A GPIO pin can often be configured as a digital input, push-pull output, or alternate peripheral function. Configuration matters: an output actively drives voltage, while an input mostly observes it. Treating a pin number as if it were only a software variable ignores current limits, voltage limits, and startup behavior.

Digital does not mean infinitely sharp. Input circuitry classifies a voltage below a specified low threshold as 0 and above a high threshold as 1; the middle region is not guaranteed. An unconnected input can drift through that region and change with a nearby hand. A pull-up resistor gives it a weak default high level, while a button to ground creates a strong low. With a 3.3 V supply and 10 kΩ pull-up, a pressed button draws I = V/R = 3.3/10,000 = 0.33 mA. Active-low logic then means pressed is read as 0, a convention the firmware should name rather than “fix” mysteriously.

Outputs source or sink only limited current. An LED needs a series resistor; motors, relays, and vacuum-blower motors require a driver stage and usually suppression, not a GPIO connection. For a status LED with about 2.0 V forward drop and a desired 4 mA from 3.3 V, R = (3.3 - 2.0)/0.004 = 325 Ω, so choosing the next common value 330 Ω is a conservative build decision.

A common misconception is that internal pull-ups are precise power resistors. They are weak bias elements with broad tolerance, useful for buttons but not for powering devices or defining fast signal edges. Other failures include configuring two connected push-pull outputs against each other, exceeding absolute voltage limits, or assuming boot-time pin state. Read the board and MCU pin documentation before attaching a load. The associated simulator models logic transitions only; it cannot validate pin current, thresholds, or protection.`,
    workedExample: {
      problem: "A 3.3 V GPIO drives a red LED with 2.0 V nominal drop. The target current is 5 mA, but available resistors are 220 Ω, 330 Ω, and 1 kΩ. Choose one and compute current.",
      steps: [
        "Ideal R = (3.3 V - 2.0 V) / 0.005 A = 260 Ω.",
        "With 220 Ω, estimated current is 1.3 V / 220 Ω = 5.9 mA; with 330 Ω it is 3.9 mA.",
        "Choose 330 Ω to stay below the 5 mA target. Separately check this controller's per-pin and bank current limits and guaranteed output voltage; there is no universal GPIO current rating.",
      ],
      result: "Use 330 Ω; the first-order LED current estimate is about 3.9 mA.",
      sanityCheck: "The resistor drops about 1.3 V, and 1.3 V / 330 Ω ≈ 0.0039 A. Actual current varies with LED forward voltage and output resistance.",
    },
    exercise: {
      question: "A button input reads HIGH when untouched and LOW when pressed using an internal pull-up. Why is the untouched reading stable?",
      choices: [
        "The input pin generates a random HIGH whenever open",
        "The pull-up weakly connects the input to the logic supply while the button provides a lower-resistance path to ground when pressed",
        "The button stores charge like a battery",
        "The software delay forces the electrical voltage HIGH",
      ],
      answerIndex: 1,
      explanation: "The pull-up establishes a defined electrical default; pressing the button overrides it with a ground path. An open input without bias is not guaranteed HIGH. A mechanical button does not store the logic level, and a delay can filter time behavior but cannot create a missing voltage bias.",
    },
    lab: {
      goal: "Wire an active-low button and resistor-limited LED, then distinguish wiring, configuration, and logic faults.",
      equipment: ["3.3 V microcontroller board", "momentary button", "330 Ω resistor", "LED", "breadboard and jumpers", "multimeter"],
      steps: [
        "With USB disconnected, wire the LED and 330 Ω resistor in series from a GPIO to ground; verify no short with continuity mode.",
        "Wire the button from a second GPIO to ground and enable that pin’s internal pull-up.",
        "Print the raw button level and set the LED on only when the input is LOW.",
        "Measure LED resistor voltage while on and calculate current rather than claiming the target value was achieved.",
        "Introduce a deliberate safe fault by disabling the pull-up while leaving the input otherwise open; observe instability, then restore the pull-up.",
      ],
      observe: [
        "Expected: untouched input is HIGH, pressed input is LOW, and the LED follows the named pressed condition.",
        "Record actual resistor voltage and calculated current; expected current from nominal values is about 3.9 mA.",
        "Expected fault signature: the unbiased input may change unpredictably or respond to touch; exact behavior is an actual observation, not guaranteed.",
      ],
      transfer: "Design the logic and interface boundary for a toy-car bumper switch that must read safely at startup and stop a driver without powering the motor from GPIO.",
      cautions: ["Disconnect power before rewiring; use only logic-level voltage and never attach a motor, appliance, or mains conductor directly to a GPIO."],
    },
    projectIds: ["sensor", "desk-robot"],
    glossary: ["gpio", "pull-up", "logic-threshold", "source-current", "sink-current"],
    sources: [micropython, circuits],
    simulation: "gpio-state-machine",
  },
  {
    id: "timers-pwm",
    track: "embedded",
    title: "Timers, deadlines, and PWM",
    summary: "Use hardware timebases and PWM duty cycle to schedule work and choose a switching rate that controls average power without confusing frequency with resolution.",
    minutes: 60,
    level: "Practice",
    prerequisites: ["mcu-gpio"],
    relatedStudy: ["programming-state", "motor-drivers"],
    outcomes: [
      "Calculate timer periods and PWM duty cycles, implement rollover-safe periodic work, and explain what a PWM output does and does not control.",
    ],
    concepts: `A timer counts clock ticks so firmware can act at useful intervals without staring at a wall clock. The same idea coordinates a screen refresh, a sensor sample, or a motor-control pulse. If a counter advances at f_tick ticks per second, one tick lasts T_tick = 1/f_tick, and N ticks span N/f_tick seconds. Hardware compare units can change a pin or request service when the count reaches a chosen value.

Pulse-width modulation switches an output repeatedly. Duty cycle D = t_on/T is the fraction of each period that is on, while PWM frequency f = 1/T says how often periods repeat. For an ideal 12 V source at 25% duty, the time-average switched voltage is 3 V, but the instantaneous motor-terminal waveform still alternates between approximately 0 V and 12 V. Motor inductance and inertia smooth current and speed; an LED averages brightness to the eye. This is not an adjustable DC supply for every load.

Timer resolution and frequency trade off when a fixed clock supplies the counter. With a 1 MHz timer and 100-count period, PWM is 10 kHz with 101 possible compare positions if endpoints are included. A larger period permits finer duty steps but lowers frequency. Choosing 20 kHz for a small motor can move switching above much of human hearing, yet driver losses and MCU limits must be checked. That frequency choice is a build decision, not folklore.

Common errors include confusing 50% duty with half speed, assuming duty directly sets torque under every load, and writing delay-based schedules that drift. For periodic work, advance the deadline by the intended period rather than setting it to “now plus period” after variable work. Counter rollover is normal; use the platform’s documented difference arithmetic rather than comparisons that fail once the counter wraps. The associated simulation is a bounded scheduling model, not a reproduction of a particular timer peripheral.`,
    workedExample: {
      problem: "An 8 MHz timer uses a prescaler of 8 and counts 0 through 199 for PWM. Find frequency and the compare value nearest 30% duty.",
      steps: [
        "Timer tick frequency = 8 MHz / 8 = 1 MHz, so each tick is 1 µs.",
        "The inclusive 0…199 period has 200 ticks, so T = 200 µs and f = 1/200 µs = 5 kHz.",
        "Thirty percent of 200 ticks is 60 on-ticks, so configure the platform’s compare semantics for 60 high ticks.",
      ],
      result: "The PWM frequency is 5 kHz and 60 of 200 ticks produces 30% duty under the stated edge convention.",
      sanityCheck: "5,000 periods/s × 200 ticks/period = 1,000,000 ticks/s, matching the prescaled timer clock.",
    },
    exercise: {
      question: "A periodic task should run every 10 ms. Its work sometimes takes 3 ms. Which update best avoids accumulating phase drift?",
      choices: [
        "After the work, set next = current_time + 10 ms every time",
        "When due, advance next = next + 10 ms and handle any documented missed-period policy",
        "Insert a fixed 10 ms blocking delay before every check",
        "Increase PWM duty until the task catches up",
      ],
      answerIndex: 1,
      explanation: "Advancing from the prior deadline preserves the intended time grid; a clearly defined overrun policy handles missed periods. Scheduling from completion adds variable work time to every interval. Blocking delays worsen responsiveness, and PWM duty is unrelated to software scheduling.",
    },
    lab: {
      goal: "Measure PWM timing and compare non-blocking periodic scheduling with a drifting completion-based schedule.",
      equipment: ["Microcontroller with PWM", "LED and 330 Ω resistor", "logic analyzer or oscilloscope if available", "serial console"],
      steps: [
        "Configure an LED PWM output near 1 kHz and command 25%, 50%, and 75% duty; log requested values.",
        "If an instrument is available, measure high time and period at one setting; otherwise use a slow 2 Hz test waveform and timestamp edges in software.",
        "Schedule a status print every 100 ms by advancing the stored deadline from its prior value.",
        "Introduce a deliberate fault by scheduling from task completion and adding 20 ms of simulated work; compare timestamp drift, then restore deadline-based scheduling.",
        "Document timer frequency, resolution, and whether the output polarity inverts the numeric duty.",
      ],
      observe: [
        "Expected: nominal high time at 1 kHz and 25% duty is 0.25 ms; actual measured period and high time must be recorded separately.",
        "Expected: deadline-based timestamps remain near multiples of 100 ms, while completion-based scheduling accumulates the added work time.",
        "Record actual jitter and instrument resolution rather than interpreting requested duty as measured duty.",
      ],
      transfer: "Choose a PWM frequency and initial duty limit for a transistor-driven miniature fan, stating what motor/driver documentation you would verify before testing.",
      cautions: ["Drive only the resistor-limited LED directly; a fan or motor requires a suitable driver and separate current-path analysis."],
    },
    projectIds: ["desk-robot", "cyberdeck"],
    glossary: ["timer", "period", "frequency", "duty-cycle", "jitter"],
    sources: [micropython, blinkWithoutDelay],
    simulation: "gpio-state-machine",
  },
  {
    id: "adc-sampling",
    track: "embedded",
    title: "ADC sampling and honest resolution",
    summary: "Convert ADC codes into calibrated quantities and choose sample rate, reference, and filtering from the signal rather than from nominal bit count.",
    minutes: 65,
    level: "Practice",
    prerequisites: ["mcu-gpio", "algebra-trig"],
    relatedStudy: ["data-structures", "probability-uncertainty", "capacitance-transients"],
    outcomes: [
      "Translate ADC counts to voltage with uncertainty, identify clipping and aliasing, and design a repeatable low-voltage sampling test.",
    ],
    concepts: `An analog-to-digital converter turns a continuous input range into numbered bins. It is like reporting a ruler position using only whole millimeters: nearby values may receive the same code. For an ideal N-bit converter spanning 0 to V_ref, there are 2^N codes and a nominal step near V_ref/2^N. A 12-bit, 3.3 V range therefore has about 0.806 mV per code. That is code width, not guaranteed measurement accuracy.

A useful conversion is V_est = code × V_ref/(2^N - 1) when the device maps the maximum code to the reference. Documentation may specify a different convention. Reference tolerance, input noise, nonlinearity, source impedance, and calibration all affect the result. A voltage divider must remain inside the pin’s allowed range under worst case, not merely at its typical input. For a 5 V signal into a 3.3 V-only ADC, equal resistors would produce 2.5 V, but input protection, grounding, source impedance, and fault voltage still need review.

Sampling also describes time. A sample rate f_s can represent a sinusoid unambiguously only when the signal is suitably band-limited below f_s/2. Sampling a 70 Hz tone at 100 samples/s can resemble 30 Hz: aliasing. More samples do not repair information already folded by inadequate analog bandwidth. A simple RC low-pass before the ADC can limit high-frequency content, but its time constant and ADC acquisition requirements must be chosen deliberately.

The build decision for a slow temperature sensor might be 10 samples/s and averaging, while a microphone envelope needs different bandwidth. A common misconception is that 12 bits means four decimal digits of truth. Repeated codes can reveal noise and effective resolution, but agreement with a calibrated reference establishes accuracy. Clipped runs of zero or maximum code indicate range failure, not a stable physical phenomenon.`,
    workedExample: {
      problem: "A 12-bit ADC uses a measured 3.28 V reference and returns code 2480. Using the endpoint-calibrated convention that maps code 4095 to the reference, estimate input voltage and the approximate quantization half-step.",
      steps: [
        "Maximum code is 2^12 - 1 = 4095.",
        "V_est = 2480 × 3.28 V / 4095 = 1.986 V (rounded).",
        "The ideal code-bin width is 3.28 V / 4096 = 0.801 mV, so the approximate quantization half-step is ±0.400 mV before other errors. The endpoint calibration factor above is a different convention from the bin width.",
      ],
      result: "The code corresponds to about 1.986 V with an ideal quantization half-step near ±0.00040 V; total measurement uncertainty is larger unless other errors are bounded.",
      sanityCheck: "2480/4095 ≈ 0.606 of full scale, and 0.606 × 3.28 V ≈ 1.99 V, safely within the range.",
    },
    exercise: {
      question: "A steady sensor repeatedly returns the maximum ADC code. What is the best first interpretation?",
      choices: [
        "The physical quantity is exactly equal to the printed maximum",
        "The input may be clipping at or above the ADC range, so inspect the circuit and range before interpreting the quantity",
        "Averaging more maximum codes will recover the missing voltage",
        "The sample rate must be doubled because all constant signals alias",
      ],
      answerIndex: 1,
      explanation: "Maximum code marks the top representable bin and may hide any larger input. Circuit range and pin safety come first. Averaging clipped values cannot reconstruct excess amplitude. A constant signal does not alias merely because it is constant; doubling rate does not correct saturation.",
    },
    lab: {
      goal: "Calibrate an ADC channel against a multimeter and distinguish quantization, noise, and clipping.",
      equipment: ["3.3 V microcontroller with ADC", "10 kΩ potentiometer", "multimeter", "breadboard and jumpers", "serial console"],
      steps: [
        "With power disconnected, wire the potentiometer ends to 3.3 V and ground and its wiper to the ADC; check the board’s ADC range.",
        "At roughly 25%, 50%, and 75% rotation, collect 100 codes and separately measure wiper voltage with the meter.",
        "Calculate mean, minimum, maximum, code spread, and voltage estimate using a measured supply/reference if the board exposes it.",
        "Introduce a deliberate safe fault by moving the wiper near the upper rail until codes clip; identify the repeated maximum and then return to midrange.",
        "State whether differences are resolution, repeatability, reference, or meter uncertainty rather than calling them all ADC error.",
      ],
      observe: [
        "Expected: mean code rises monotonically with wiper voltage and near-rail readings may clip.",
        "Record actual meter voltage, code statistics, and conversion residual at each point; expected values are not measurements.",
        "Expected fault signature: many consecutive maximum codes lose information about further voltage increase.",
      ],
      transfer: "Specify sample rate, input range, and one anti-alias measure for logging a slowly changing vacuum-blower pressure sensor without opening or modifying an appliance.",
      cautions: ["Keep the wiper strictly within the documented ADC voltage range; disconnect power before changing wiring and do not probe household appliances."],
    },
    projectIds: ["sensor", "cyberdeck"],
    glossary: ["adc", "quantization", "reference-voltage", "sample-rate", "aliasing", "clipping"],
    sources: [micropython, circuits],
  },
  {
    id: "interrupts-scheduling",
    track: "embedded",
    title: "Interrupts and cooperative scheduling",
    summary: "Keep interrupt service bounded and move substantial work into a scheduled main context so latency remains explainable.",
    minutes: 60,
    level: "Practice",
    prerequisites: ["programming-state", "data-structures", "timers-pwm"],
    outcomes: [
      "Partition event capture from deferred processing, estimate utilization and worst-case latency, and diagnose interrupt overload or shared-state races.",
    ],
    concepts: `An interrupt lets hardware tap the processor on the shoulder when an event occurs. It can capture a timestamp for a wheel edge or note that a byte arrived without making the main loop poll constantly. The interrupt service routine, or ISR, temporarily preempts ordinary code. That convenience creates a timing debt: while one ISR runs, lower-priority work may wait.

The robust pattern is “capture, signal, defer.” The ISR records the minimum data needed—perhaps a counter or timestamp—sets a flag, and returns. The main loop later copies that state and performs formatting, filtering, display updates, or communication. If events arrive at rate r and each ISR consumes execution time C, interrupt utilization is U = rC. At 2,000 events/s and 20 µs each, U = 0.04, or 4%. Average utilization is not enough: bursts, disabled-interrupt sections, priorities, and the longest non-preemptible work determine worst-case latency.

Shared data can change between two main-loop instructions. An increment or multi-byte timestamp may not be atomic on every processor. A brief documented critical section or a single-producer/single-consumer queue can create a consistent snapshot. The build decision for an encoder is often to count edges in the ISR and compute speed every 20 ms in the scheduler, not to print from each edge.

A common misconception is that interrupts make code instantaneous. They only change who waits. Long ISRs, dynamic allocation, blocking I/O, and serial prints can lose subsequent events or starve control work. Another failure is attaching a mechanical button interrupt without handling contact bounce, producing many edges per press. Use interrupts when latency or event capture justifies them; periodic polling is often simpler and more testable for slow human inputs. State an overflow policy when a queue cannot absorb a burst.`,
    workedExample: {
      problem: "An encoder can produce 4,800 edges/s. Its ISR takes 12 µs, and a 1 ms timer ISR takes 30 µs each tick. Estimate total interrupt CPU utilization.",
      steps: [
        "Encoder load = 4,800/s × 12 µs = 57,600 µs/s = 5.76%.",
        "Timer load = 1,000/s × 30 µs = 30,000 µs/s = 3.00%.",
        "Total nominal interrupt utilization = 8.76%, before entry overhead, bursts, or critical sections.",
      ],
      result: "The two ISRs consume about 8.76% of one CPU second under the stated rates, leaving 91.24% nominally for other execution.",
      sanityCheck: "Both loads are below 10% individually and their time totals, 87,600 µs, are 0.0876 of 1,000,000 µs.",
    },
    exercise: {
      question: "A GPIO interrupt currently parses JSON and prints a message before returning. Events are being lost. What is the best redesign?",
      choices: [
        "Increase the JSON document size inside the ISR",
        "Capture a compact event or increment a counter in the ISR, then parse and print in scheduled main code",
        "Disable all other interrupts permanently",
        "Add a blocking delay to ensure each message finishes",
      ],
      answerIndex: 1,
      explanation: "Compact capture shortens the preempting path and lets ordinary code handle variable-duration work. Larger parsing, permanent interrupt disabling, and delays all increase blind time. A queue still needs explicit capacity and overflow behavior, but it separates timing-critical capture from expensive processing.",
    },
    lab: {
      goal: "Compare interrupt event capture with deferred reporting and expose the failure caused by slow ISR work.",
      equipment: ["Microcontroller", "button or signal jumper", "serial console", "logic analyzer optional"],
      steps: [
        "Configure a low-rate falling-edge interrupt that increments a counter and stores the latest timestamp.",
        "Every 100 ms in the main loop, copy and print the count plus elapsed time; document how the snapshot is protected.",
        "Generate ten deliberate edges with a jumper or debounced source and compare generated versus reported count.",
        "Introduce a deliberate fault by adding a conspicuously slow operation in the ISR only long enough for a controlled low-voltage test; observe missed events or latency, then remove it.",
        "Add a bounded event queue or counter overflow indicator and force its limit at a safe synthetic rate.",
      ],
      observe: [
        "Expected: the short ISR captures all slow deliberate edges and printing occurs on the scheduler’s cadence.",
        "Record actual generated and captured counts and timestamp spread; do not infer zero loss without comparing them.",
        "Expected fault signature: slow ISR work increases response latency and may reduce captured count; exact loss depends on hardware and rate.",
      ],
      transfer: "Partition a camera-trigger input into ISR work, queued data, and main-loop processing, including what happens if triggers arrive faster than images can be handled.",
      cautions: ["Use only logic-level sources sharing a valid ground; do not connect unknown camera flash, automotive, or appliance signals directly to a GPIO."],
    },
    projectIds: ["sensor", "desk-robot"],
    glossary: ["interrupt", "latency", "isr", "critical-section", "utilization", "race-condition"],
    sources: [micropython, blinkWithoutDelay],
  },
  {
    id: "communications-protocols",
    track: "embedded",
    title: "Communication protocols as contracts",
    summary: "Frame and validate messages while separating electrical signaling, byte transport, and application meaning for easier fault isolation.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["mcu-gpio", "digital-interfaces"],
    relatedStudy: ["data-structures", "interrupts-scheduling"],
    outcomes: [
      "Design and trace a bounded message frame with addressing, length, error detection, timeout, and a documented retry policy.",
    ],
    concepts: `Devices communicate only when several agreements line up. The wire-level layer defines voltage, timing, and who may drive. A transport convention groups bits into bytes. An application protocol says that a particular byte means temperature, motor command, or error. Separating these layers helps diagnosis: clean electrical edges do not prove that two devices agree about byte order or units.

UART sends framed bytes asynchronously using an agreed baud rate. I²C shares clock and data among addressed devices and uses open-drain lines with pull-ups. SPI commonly uses a clock, two data directions, and a chip-select per target. Names alone do not guarantee voltage compatibility, pin assignment, mode, speed, or connector orientation. For an I²C sensor cable, choosing pull-up resistance involves bus capacitance and device sink current; blindly adding multiple breakout-board pull-ups can make the combined resistance too low.

At the message layer, a bounded frame might contain sync, version, type, length, payload, and checksum. If payload length is L, the receiver must reject L above its allocated capacity before copying. A simple sum checksum detects some corruption but not all; stronger CRCs provide specified detection properties. Timeout and retry rules must consider whether repeating a command is safe. “Set speed to 40%” is idempotent; “advance 10 mm” may execute twice unless it carries a sequence number and duplicate handling.

A common misconception is that a checksum provides security or proves semantic correctness. It only detects a class of accidental changes; a perfectly checksummed command can still use the wrong units. Another failure is endlessly waiting for a missing byte, freezing the robot. The build decision is to cap frame length, set a timeout based on baud and maximum frame size, and expose distinct errors—timeout, invalid length, checksum, unsupported version—so fault isolation is possible.`,
    workedExample: {
      problem: "A UART link runs at 115,200 bit/s using 8 data bits, one start bit, and one stop bit. Estimate transmission time for a 32-byte frame and choose a timeout with 3× margin.",
      steps: [
        "Each byte occupies 10 transmitted bits, so the frame uses 32 × 10 = 320 bits.",
        "Ideal wire time = 320 / 115,200 s = 0.00278 s = 2.78 ms.",
        "A 3× wire-time margin gives 8.33 ms; choose a practical 9 ms or larger value after accounting for sender scheduling.",
      ],
      result: "The ideal wire time is about 2.78 ms; a starting receive timeout of 9 ms supplies slightly more than 3× margin, subject to system scheduling tests.",
      sanityCheck: "At roughly 11,520 bytes/s, 32 bytes should take about 32/11,520 s, which is the same 2.78 ms.",
    },
    exercise: {
      question: "A receiver gets a valid-checksum command ADVANCE 10 mm, sends no acknowledgement because the reply is lost, and the sender retries. What protocol feature prevents an unintended 20 mm move?",
      choices: [
        "A brighter status LED",
        "A unique sequence number with receiver-side duplicate detection and cached acknowledgement",
        "A longer payload without any identifier",
        "Removing the timeout so the sender waits forever",
      ],
      answerIndex: 1,
      explanation: "A sequence number lets the receiver recognize the retry as the same operation and return the prior result without executing again. Checksums only test frame corruption. Extra anonymous bytes add no identity, while waiting forever converts packet loss into a permanent system hang.",
    },
    lab: {
      goal: "Implement a small serial frame parser and diagnose truncation, corruption, and duplicate commands from captured bytes.",
      equipment: ["Microcontroller and USB serial link or two logic-level boards", "serial terminal", "jumper wires if using two boards", "logic analyzer optional"],
      steps: [
        "Define a frame with version, sequence, type, length up to 16, payload, and an explicitly named checksum algorithm.",
        "Write the receiver as a state machine with a bounded buffer and timeout; log accepted sequence numbers and error categories.",
        "Send one valid idempotent LED-duty command and confirm its acknowledgement.",
        "Introduce deliberate faults one at a time: wrong checksum, declared length 17, and a truncated frame; verify distinct rejection paths.",
        "Repeat the valid frame with the same sequence number and verify it is acknowledged but not applied twice.",
      ],
      observe: [
        "Expected: valid frames change the test output once; corrupt, oversized, or incomplete frames do not change it.",
        "Record actual transmitted hex bytes, receiver log, and elapsed timeout; expected acceptance is not evidence of receipt.",
        "Expected fault signatures are checksum error, length error, and timeout respectively, rather than one generic failure.",
      ],
      transfer: "Write the layer-by-layer checks for a screen module that powers up but shows no sensor values: voltage/ground, bus pins and pull-ups, address, frame fields, then units.",
      cautions: ["Confirm both boards use compatible logic voltage and a common ground before wiring; never connect RS-232, automotive, or appliance-level signals directly."],
    },
    projectIds: ["sensor", "desk-robot", "cyberdeck"],
    glossary: ["protocol", "frame", "baud-rate", "checksum", "timeout", "idempotent"],
    sources: [micropython, bme280],
  },
  {
    id: "firmware-debugging",
    track: "embedded",
    title: "Firmware debugging from evidence",
    summary: "Localize faults with reproducible cases, layered observations, and assertions instead of changing several plausible causes at once.",
    minutes: 70,
    level: "Advanced",
    prerequisites: ["programming-state", "communications-protocols", "experimental-method"],
    relatedStudy: ["adc-sampling", "interrupts-scheduling"],
    outcomes: [
      "Construct a minimal reproducible firmware test, classify the failing layer, and use logs, assertions, and controlled substitutions to isolate one cause.",
    ],
    concepts: `Debugging is the work of shrinking uncertainty. When a sensor-driven screen freezes, “the firmware is broken” is too broad to test. Divide the system into claims: power is present, the loop still advances, bus transactions complete, received bytes pass validation, converted values stay in range, and display updates occur. Add observations at boundaries until one claim first stops being true.

A reproducible case specifies initial state, inputs, software version, timing, and expected versus actual behavior. A timestamped structured log can record event, state, and key values, but logging changes timing and finite buffers overflow. Assertions turn assumptions into visible failures: length <= 16, state is valid, sample interval is positive. In deployed builds an assertion policy must lead to a defined safe response and retained reset cause, not an uncontrolled motor state.

Controlled substitution is powerful. Replace a live sensor with a fixed known value to test the display path; replace the display update with a serial print to test acquisition. Change one factor and predict what each hypothesis says. If fixed data still freezes the display, the sensor is less likely to be causal. This is a build decision about diagnostic seams: preserving a raw-message counter, last-error code, and firmware version may cost a few bytes but saves hours.

A common misconception is that the last line printed caused the crash. It only proves execution reached approximately that point, and buffered output may lag. Another failure is “shotgun debugging”: changing timing, wiring, and parsing together, then accepting a disappearance as proof. Heisenbugs can move when logging changes load. Keep a baseline, capture exact changes, and restore variables. Distinguish compile errors, startup/reset faults, timing failures, electrical faults, corrupt data, and incorrect requirements before choosing an instrument.`,
    workedExample: {
      problem: "A 50 Hz sampling loop reports gaps. Logged timestamps are 0, 20, 40, 60, 140, 160 ms, and a bus-error counter rises at 60 ms. What can the trace establish?",
      steps: [
        "Nominal interval is 1/50 s = 20 ms; the first three intervals match it.",
        "The 60→140 ms interval is 80 ms, so three expected sample instants at 80, 100, and 120 ms are absent.",
        "The bus-error counter provides correlation at the last normal timestamp, but does not alone prove the bus error caused the 80 ms gap.",
        "Next isolate by substituting a fixed sample or adding start/end timestamps around the bounded bus call.",
      ],
      result: "The evidence confirms a single 80 ms scheduling gap and three missing nominal samples; it narrows the next test to the acquisition path without yet proving causation.",
      sanityCheck: "From 0 through 160 ms inclusive, a 20 ms grid has nine instants; the trace has six entries, exactly three fewer.",
    },
    exercise: {
      question: "A robot resets only when the motor starts. Which first experiment best separates power integrity from motion-software logic?",
      choices: [
        "Rewrite the entire state machine and increase every delay",
        "Run the same motor command with the mechanical load safely removed while logging reset cause and supply minimum, then compare with a no-motor dummy path",
        "Delete error handling so the reset is less visible",
        "Assume the motor driver is defective because resets correlate with motion",
      ],
      answerIndex: 1,
      explanation: "The paired, instrumented tests vary the electrical/mechanical load while preserving the command path and collect evidence about supply/reset state. A rewrite changes many variables. Hiding errors removes evidence. Correlation with motion supports several hypotheses—voltage sag, EMI, current limiting, or code—so it does not identify the driver by itself.",
    },
    lab: {
      goal: "Diagnose a seeded firmware fault using a hypothesis table and boundary logs.",
      equipment: ["Microcontroller", "known low-voltage sensor or potentiometer", "serial console", "multimeter", "notebook or issue template"],
      steps: [
        "Create a baseline program that samples at 10 Hz, range-checks the value, and prints sequence, timestamp, raw count, converted value, and error code.",
        "Record firmware identifier, wiring, starting input, expected cadence, and actual baseline for 30 samples.",
        "Introduce one deliberate fault: use the wrong reference value in conversion without changing acquisition.",
        "List predictions for ADC/wiring, conversion, and scheduler hypotheses; compare raw counts and meter voltage to localize the mismatch.",
        "Restore the reference, rerun the identical case, and retain before/after evidence plus one assertion that would catch recurrence.",
      ],
      observe: [
        "Expected: the seeded conversion fault changes engineering units while raw counts and cadence remain comparable.",
        "Record actual raw counts, meter readings, timestamps, and converted values; label the nominal 10 Hz cadence as expected until measured.",
        "Expected diagnostic: stable raw evidence with systematically scaled output points to conversion rather than the electrical input.",
      ],
      transfer: "Create a five-check fault-isolation plan for a small printer mechanism that homes correctly but stops accepting motion commands, without opening or probing any mains-powered section.",
      cautions: ["Seed only reversible software or low-voltage signal faults; never create shorts, defeat protection, stall a motor, or work inside energized appliances."],
    },
    projectIds: ["sensor", "desk-robot", "cyberdeck"],
    glossary: ["reproducibility", "assertion", "structured-log", "fault-isolation", "reset-cause", "heisenbug"],
    sources: [missingSemester, micropython, continuityGuide],
  },
  {
    id: "robot-architecture",
    track: "robotics",
    title: "Robot architecture and responsibility",
    summary: "Partition sensing, estimation, decision, actuation, power, and safety so a desk robot’s behavior and failure boundaries stay inspectable.",
    minutes: 60,
    level: "Foundation",
    prerequisites: ["engineering-workflow"],
    relatedStudy: ["firmware-debugging", "feedback-pid"],
    outcomes: [
      "Draw a robot’s energy and information paths, assign responsibilities to components, and justify one interface boundary from rate and failure behavior.",
    ],
    concepts: `A robot is not defined by having a motor or a computer. It closes a loop between sensing the world, estimating what that evidence means, choosing an action, and applying energy through an actuator. A toy car that measures wheel motion, decides how to steer, and drives motors has this loop. Power distribution and safety supervision run alongside it; they are not afterthoughts.

Architecture assigns responsibilities and interfaces. A useful decomposition is sensing → estimation → planning/control → actuation, with logging and supervision observing each boundary. The arrows carry named data at named rates: wheel_ticks at 100 Hz, pose estimates at 20 Hz, velocity commands at 20 Hz, and motor PWM at 1 kHz. Energy follows a different path from battery through protection and drivers to motors. Mixing those diagrams can hide the fact that a tiny logic signal commands a much larger power flow.

Interface rates and failure semantics shape the build. If a high-level computer sends velocity commands to a microcontroller, a watchdog can require a fresh command every 100 ms; expiry commands zero output locally even if the high-level process freezes. That boundary keeps the fast motor loop and immediate stop behavior close to hardware, while mapping or screen UI can run elsewhere. A single processor may implement every block, but the conceptual contracts still matter.

A common misconception is that a layered diagram proves the system is modular. If two blocks share undocumented global state, units, or timing assumptions, the boundary is only decorative. Another failure is placing “safety” in one box while every other block can bypass it. Trace one command from user intent to motor voltage and one fault back to a safe response. Architecture is a set of testable responsibilities: who owns time, coordinate frames, limits, stale data, and recovery.`,
    workedExample: {
      problem: "A controller expects a 20 Hz velocity command and must stop within 150 ms after communication fails. Choose a watchdog timeout and estimate missed commands before stopping.",
      steps: [
        "Command period = 1/20 Hz = 50 ms.",
        "A 100 ms timeout tolerates the missing arrival at 50 ms and expires around the second expected arrival at 100 ms.",
        "Allow 10 ms for local detection/output update, giving about 110 ms command-to-zero latency, below the 150 ms requirement before mechanical coast is considered.",
      ],
      result: "Use a 100 ms freshness timeout with local zero-output handling; test physical stopping separately because the watchdog bounds command removal, not coast distance.",
      sanityCheck: "A 150 ms timeout alone would consume the whole requirement before detection and actuation, so it cannot meet the stated bound with any overhead.",
    },
    exercise: {
      question: "Where should the response to a lost high-level command live when a microcontroller directly drives the motor bridge?",
      choices: [
        "Only in the remote user interface",
        "In a local supervisor near the motor output, using command freshness to force a defined safe command",
        "Only in a log reviewed after operation",
        "Nowhere, because packet checksums prevent command loss",
      ],
      answerIndex: 1,
      explanation: "The local controller can act even when the communication or high-level computer has failed. A UI and logs are valuable observers but cannot guarantee timely local action. Checksums detect some corruption; they do not prevent lost packets, frozen senders, or stale valid commands.",
    },
    lab: {
      goal: "Create and exercise an architecture contract for a low-voltage desk robot mock-up.",
      equipment: ["Microcontroller", "two LEDs with resistors or a safely driven small motor", "button", "serial console", "paper or diagram tool"],
      steps: [
        "Draw separate energy and information paths for command input, supervisor, controller, output, and feedback.",
        "Define message names, units, nominal rates, owner, stale threshold, and safe value at each software boundary.",
        "Implement serial velocity commands as an LED duty request plus a 100 ms watchdog that forces zero.",
        "Introduce a deliberate fault by stopping command transmission; record the last receive and zero-output timestamps.",
        "Repeat with malformed but checksummed-out commands and confirm they are rejected without refreshing freshness.",
      ],
      observe: [
        "Expected: continuous valid commands maintain output; silence causes local output to become zero near the watchdog threshold.",
        "Record actual timeout and update latency separately from the 100 ms configured value.",
        "Expected fault signature: communication stops upstream while the supervisor and output path continue long enough to enforce the safe state.",
      ],
      transfer: "Partition a camera-guided toy car into blocks and justify whether image processing, steering control, and motor cutoff belong on one processor or across a documented interface.",
      cautions: ["Prove watchdog behavior with LEDs or wheels raised and restrained before any floor test; keep all work at protected low voltage."],
    },
    projectIds: ["desk-robot", "blank"],
    glossary: ["robot-architecture", "interface", "watchdog", "command-freshness", "supervisor"],
    sources: [modernRobotics, controlTutorials],
  },
  {
    id: "kinematic-chains",
    track: "robotics",
    title: "Kinematic chains and pose",
    summary: "Compose joint transformations and choose link dimensions from reachable geometry before committing a linkage or camera mount.",
    minutes: 75,
    level: "Practice",
    prerequisites: ["vectors-frames", "mechanisms-kinematics"],
    relatedStudy: ["robot-architecture"],
    outcomes: [
      "Compute planar forward kinematics for a two-link chain, distinguish pose from force, and diagnose frame or angle-convention errors.",
    ],
    concepts: `A kinematic chain connects rigid links with joints. Each joint permits a kind of motion: a revolute joint changes angle, while a prismatic joint changes extension. A desk lamp, printer carriage, and robot arm can all be described this way. Kinematics asks where parts are and how geometry relates motions, without yet asking what forces or torques create them.

For a planar two-revolute-link arm with lengths L1 and L2, base-frame endpoint position is x = L1 cos θ1 + L2 cos(θ1 + θ2), y = L1 sin θ1 + L2 sin(θ1 + θ2). The second angle is relative to the first link, so its world orientation is their sum. This is forward kinematics: joint values produce pose. Inverse kinematics asks for joint values that reach a desired pose and may have two solutions, one solution at a boundary, or none.

Frames keep statements honest. A camera may report a target in camera coordinates while the arm controller needs base coordinates. Homogeneous transforms combine rotation and translation so chained relationships can be multiplied in order. Order matters because rotations and translations generally do not commute. Before choosing a 120 mm + 80 mm linkage, a builder should compare the reachable annulus: maximum reach L1 + L2 = 200 mm and minimum radial reach |L1 - L2| = 40 mm, ignoring collisions and joint limits.

A common misconception is that reaching a point proves the pose is usable. Joint limits, self-collision, tool orientation, cable bend, and singular geometry may rule it out. Another failure is mixing degrees with radian-based library functions or treating θ2 as an absolute world angle. Draw axes and a zero pose, state angle sign and units, calculate a simple configuration, then compare the physical chain. Kinematics predicts geometry, not payload capability or motor torque.`,
    workedExample: {
      problem: "A planar arm has L1 = 120 mm, L2 = 80 mm, θ1 = 30°, and relative θ2 = 60°. Find its endpoint.",
      steps: [
        "The second link’s world angle is θ1 + θ2 = 90°.",
        "x = 120 cos 30° + 80 cos 90° = 103.9 mm + 0 mm = 103.9 mm.",
        "y = 120 sin 30° + 80 sin 90° = 60.0 mm + 80.0 mm = 140.0 mm.",
      ],
      result: "The endpoint is approximately (103.9 mm, 140.0 mm) in the defined base frame.",
      sanityCheck: "Its radial distance is about 174.3 mm, between the chain’s 40 mm minimum and 200 mm maximum possible reach.",
    },
    exercise: {
      question: "For L1 = L2 = 100 mm, can the endpoint (250 mm, 0) be reached in the plane?",
      choices: [
        "Yes, because each joint can rotate 360°",
        "No, because the requested radial distance exceeds L1 + L2 = 200 mm",
        "Yes, if both angles are expressed in radians",
        "No, because two-link arms can reach only circular paths",
      ],
      answerIndex: 1,
      explanation: "Rotation cannot make rigid links longer, so 250 mm lies outside the maximum reach. Changing angle units changes representation, not geometry. The reachable set is generally an annular region subject to joint limits, not only one circle.",
    },
    lab: {
      goal: "Build a paper or cardboard two-link chain and compare predicted endpoint coordinates with observed geometry.",
      equipment: ["Cardboard strips or two rulers", "two paper fasteners", "protractor", "graph paper", "ruler", "calculator"],
      steps: [
        "Make 120 mm and 80 mm links with pivot holes centered at their ends; mark the base x- and y-axes.",
        "Set θ1 = 30° and relative θ2 = 60°, then mark the endpoint without moving the paper.",
        "Calculate the predicted point and measure the actual marked coordinates with an uncertainty based on ruler and joint looseness.",
        "Introduce a deliberate model fault by treating θ2 as an absolute 60° angle; plot that prediction and use the mismatch to identify the convention error.",
        "Try one point near 200 mm radius and note joint alignment and sensitivity to small angle changes.",
      ],
      observe: [
        "Expected: the correct relative-angle prediction lies near (104 mm, 140 mm).",
        "Record actual coordinates and estimated reading/joint uncertainty; do not relabel the calculation as a measurement.",
        "Expected fault signature: the absolute-angle mistake predicts the second link at 60° rather than 90°, shifting both coordinates.",
      ],
      transfer: "Choose two link lengths for a camera mount that must reach points 70–180 mm from its base, then list joint-limit and cable constraints that geometry alone omits.",
      cautions: ["Use blunt tools or supervised cutting for cardboard; this unpowered model validates geometry only, not structural strength."],
    },
    projectIds: ["linkage", "desk-robot"],
    glossary: ["kinematic-chain", "forward-kinematics", "inverse-kinematics", "pose", "homogeneous-transform", "workspace"],
    sources: [modernRobotics, designCourse],
  },
  {
    id: "localization-odometry",
    track: "robotics",
    title: "Localization and wheel odometry",
    summary: "Estimate a mobile robot’s pose from wheel motion while tracking how scale, slip, and heading error accumulate.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["kinematic-chains", "rates-integration"],
    relatedStudy: ["probability-uncertainty", "sensor-fusion", "torque-gearing"],
    outcomes: [
      "Convert encoder counts to differential-drive pose increments, propagate a simple uncertainty argument, and design a calibration that exposes systematic error.",
    ],
    concepts: `Localization answers “where am I relative to a map or starting frame?” Odometry answers a narrower question: “how did motion sensors say I moved?” A toy car can count wheel rotation and integrate small increments, but every diameter error, missed count, and slip becomes part of the estimate. Odometry is useful precisely because it is frequent and local, not because it is an absolute truth.

For a wheel of diameter d with N counts per revolution, distance per count is πd/N. A differential-drive robot with left and right travel Δs_L and Δs_R has center travel Δs = (Δs_R + Δs_L)/2 and heading change Δθ = (Δs_R - Δs_L)/b, where b is wheel separation. For small increments, update x by Δs cos(θ + Δθ/2), y by Δs sin(θ + Δθ/2), and θ by Δθ. The midpoint heading reduces error compared with using only the old heading.

Calibration makes parameters empirical. Command several straight runs to estimate effective distance per count, and rotations to estimate effective track width. A nominal 65 mm wheel under load may behave differently because of tire compression. Choosing calibrated effective diameter is a build decision, but tuning it to one floor may hide slip rather than create a universal constant.

A common misconception is that equal commanded PWM means equal wheel distance. Motors, load, and traction differ; encoders measure rotation, and even equal rotation can slip against the floor. Heading error is especially costly because later forward motion projects in the wrong direction. External landmarks, a camera, or other absolute observations can correct drift, but fusion must represent uncertainty and frame relationships. Never use an odometry-only bench exercise to claim navigation accuracy in an untested environment.`,
    workedExample: {
      problem: "A differential-drive robot has 65 mm wheels, 20 counts/revolution, and 150 mm wheel separation. In one interval left advances 10 counts and right 14 counts. Estimate center travel and heading change.",
      steps: [
        "Distance per count = π × 65 mm / 20 = 10.21 mm/count.",
        "Left travel = 102.1 mm and right travel = 142.9 mm; center travel = (102.1 + 142.9)/2 = 122.5 mm.",
        "Heading change = (142.9 - 102.1) mm / 150 mm = 0.272 rad = 15.6° toward the left-wheel side.",
      ],
      result: "The odometry increment is about 122.5 mm forward along the arc with a 0.272 rad heading change.",
      sanityCheck: "Because the right wheel traveled farther, the robot must curve left; the dimensionless distance difference divided by track width correctly yields radians.",
    },
    exercise: {
      question: "After several meters, wheel odometry position drifts while encoder counts remain repeatable. Which observation most directly distinguishes wheel-scale error from intermittent floor slip?",
      choices: [
        "Change the screen color",
        "Repeat measured straight runs on two surfaces and compare error proportionality and run-to-run variability",
        "Increase the stored pose to more decimal places",
        "Assume the encoder is perfect because counts repeat",
      ],
      answerIndex: 1,
      explanation: "A consistent proportional error suggests scale calibration, while surface-dependent or irregular error supports slip. More digits do not add accuracy, and repeatable shaft counts cannot prove wheel-to-floor motion. Screen appearance is unrelated to the motion evidence.",
    },
    lab: {
      goal: "Calibrate encoder distance and observe accumulated odometry error on a low-speed differential-drive platform.",
      equipment: ["Low-voltage two-wheel robot with encoders", "tape measure", "masking tape", "large paper sheet", "marker", "wheel blocks or stand"],
      steps: [
        "With drive power off, measure nominal wheel diameter and wheel separation and record uncertainty.",
        "Raise or restrain the robot; verify count sign and counts per revolution by turning each wheel by hand.",
        "Mark a one-meter straight lane, run at low speed, and log left/right counts plus odometry endpoint for three trials.",
        "Introduce a deliberate diagnostic fault in software by increasing the configured wheel diameter 10%; predict and observe the scale change, then restore it.",
        "If safe, repeat on a different loose paper or textured surface and distinguish systematic calibration from variable slip.",
      ],
      observe: [
        "Expected: the 10% diameter configuration error makes estimated travel about 10% too large for the same counts.",
        "Record actual measured travel, counts, estimated travel, lateral deviation, and surface for every trial.",
        "Expected: physical endpoints vary more when traction varies; the amount is an observation, not a promised result.",
      ],
      transfer: "Estimate how one degree of heading error affects lateral position after a 2 m hallway run, then propose one camera or landmark observation that could bound drift.",
      cautions: ["Use low speed, a clear floor area, and a reachable power cutoff; keep wheels raised for sign tests and never chase a moving robot."],
    },
    projectIds: ["desk-robot"],
    glossary: ["localization", "odometry", "encoder", "differential-drive", "pose-drift", "track-width"],
    sources: [modernRobotics, controlTutorials],
  },
  {
    id: "perception-basics",
    track: "robotics",
    title: "Perception from measurements",
    summary: "Turn raw sensor values into bounded observations by calibrating thresholds, features, and confidence against environmental variation.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["probability-uncertainty"],
    relatedStudy: ["robot-architecture", "adc-sampling", "filtering-estimation"],
    outcomes: [
      "Design a simple perception pipeline, calculate a threshold from labeled data, and identify false-positive and false-negative failure modes.",
    ],
    concepts: `A sensor produces measurements; perception turns them into claims about the world. A camera provides pixels, not “a cup.” A reflectance sensor produces voltage, not “the line.” The pipeline may include calibration, filtering, feature extraction, classification, and temporal validation. Each stage should preserve enough evidence to explain why the final claim was made.

For a one-dimensional detector, a threshold can classify values above τ as object present. Performance is summarized with true positives, false positives, true negatives, and false negatives. Precision = TP/(TP + FP) asks how often positive reports are correct; recall = TP/(TP + FN) asks how many actual positives were found. Changing τ trades these errors. The best threshold depends on consequences: a robot approaching a stair edge should prefer missed-edge risk differently from a screen auto-brightness feature reacting to shadows.

Calibration data must represent expected variation in distance, lighting, surface, and unit-to-unit differences. Suppose labeled reflectance readings for dark tape are 120–180 counts and floor readings are 360–470; τ = 270 leaves a margin in that small data set. It does not prove separation under sunlight or dust. A useful build decision is to store raw value alongside the Boolean detection and require three consecutive detections, making borderline behavior diagnosable while adding known latency.

A common misconception is that filtering creates missing information. Averaging can reduce uncorrelated noise but blurs rapid changes; a saturated or poorly placed sensor remains uninformative. Another failure is evaluating on the same few cases used to choose the threshold, which overstates performance. Split calibration and challenge cases, label expected conditions independently, and record confusion counts. With cameras, avoid treating a demo under one background as general object recognition. Perception output is an uncertain observation with a frame and timestamp, not unquestionable world state.`,
    workedExample: {
      problem: "A threshold detector is tested on 40 labeled cases: TP = 18, FP = 3, TN = 15, FN = 4. Compute precision, recall, and accuracy.",
      steps: [
        "Precision = 18/(18 + 3) = 18/21 = 0.857.",
        "Recall = 18/(18 + 4) = 18/22 = 0.818.",
        "Accuracy = (TP + TN)/40 = (18 + 15)/40 = 0.825.",
      ],
      result: "Precision is 85.7%, recall is 81.8%, and accuracy is 82.5% on this 40-case test set.",
      sanityCheck: "All four counts sum to 40, and every metric lies between 0 and 1; none alone describes both types of error.",
    },
    exercise: {
      question: "Lowering a threshold causes more samples to be labeled “obstacle.” What change is generally expected if all else stays fixed?",
      choices: [
        "Both false positives and false negatives must become zero",
        "Recall tends to rise while false positives may also rise",
        "Precision must rise because there are more positive labels",
        "The sensor’s physical resolution doubles",
      ],
      answerIndex: 1,
      explanation: "A lower threshold admits more true cases but also more negative cases, typically reducing misses while increasing false alarms. Precision can move either way and often falls. Classification policy does not change physical sensor resolution, and no threshold guarantees zero errors when classes overlap.",
    },
    lab: {
      goal: "Calibrate and challenge a simple reflectance or light-based classifier with raw evidence retained.",
      equipment: ["Microcontroller", "low-voltage light or reflectance sensor", "white paper and dark tape", "desk lamp", "ruler", "serial logger"],
      steps: [
        "Collect at least 20 labeled raw readings for paper and 20 for tape at a fixed distance; keep the labels independent of the code’s output.",
        "Choose a threshold from the calibration readings and state which side means tape.",
        "Test new positions under two lighting conditions and record TP, FP, TN, and FN rather than only successful cases.",
        "Introduce a deliberate fault by reversing the comparison operator; identify the swapped pattern in the confusion counts, then restore it.",
        "Add a three-consecutive-sample rule and measure the detection latency at the configured sample period.",
      ],
      observe: [
        "Expected: calibration classes may separate at fixed conditions, while changed light or distance can narrow or reverse the margin.",
        "Record actual raw ranges, threshold, confusion counts, and decision latency; do not present expected separation as measured.",
        "Expected fault signature: the reversed comparator makes most previously correct positives and negatives swap roles.",
      ],
      transfer: "Outline a camera pipeline for detecting a colored marker, naming the raw image, color feature, threshold, temporal rule, and one background that should be a challenge test.",
      cautions: ["Use cool low-voltage sensors and ordinary room lighting; do not aim lasers or intense lamps at eyes or camera sensors."],
    },
    projectIds: ["sensor", "desk-robot"],
    glossary: ["perception", "feature", "threshold", "precision", "recall", "confusion-matrix"],
    sources: [modernRobotics, bme280],
  },
  {
    id: "planning-navigation",
    track: "robotics",
    title: "Planning and navigation",
    summary: "Represent free space and costs explicitly, then compare a planned path with the robot’s footprint, uncertainty, and replanning rules.",
    minutes: 75,
    level: "Advanced",
    prerequisites: ["data-structures", "vectors-frames"],
    relatedStudy: ["localization-odometry", "perception-basics", "trajectories-motion"],
    outcomes: [
      "Trace a shortest-path search on a small cost grid, inflate obstacles for robot size, and define when new evidence invalidates a plan.",
    ],
    concepts: `Planning chooses a sequence of actions toward a goal; navigation executes and revises that plan using localization and perception. A route for a point drawn on paper is not automatically safe for a robot with width, turning limits, and uncertain pose. The map is a model: cells or geometric regions may be free, occupied, unknown, or assigned traversal cost.

A graph represents possible states as nodes and allowed moves as edges. Dijkstra’s algorithm expands the lowest accumulated cost g. A* expands by f = g + h, where h estimates remaining cost. If h never overestimates the true remaining cost, A* can retain shortest-path guarantees under its assumptions while exploring fewer nodes. On a four-neighbor grid with unit moves, Manhattan distance |Δx| + |Δy| is an admissible heuristic. Edge costs can represent distance, time, energy, or risk, but mixing units without an explicit weighting produces meaningless optimization.

Robot footprint matters. Configuration-space reasoning expands obstacles by the robot’s radius, then plans the center as if it were a point. A 300 mm-wide robot needs more than a 300 mm nominal gap once clearance and localization uncertainty are included. Choosing 200 mm obstacle inflation for a 150 mm half-width plus 50 mm margin is a concrete build decision; the margin must be justified and tested.

A common misconception is that the shortest grid path is a drivable trajectory. It may contain instantaneous 90° turns, graze inflated corners, or cross space that changed after mapping. A local controller must follow a feasible trajectory and stop or replan when observations contradict the map. Another failure is treating unknown as free merely to find a route. Define map resolution, footprint, cost meaning, goal tolerance, stale-data limits, and replanning triggers. Planning cannot compensate for an unlocalized robot or a sensor that cannot observe the relevant hazard.`,
    workedExample: {
      problem: "A four-neighbor grid uses 0.10 m cells. A path takes 7 orthogonal moves around an obstacle. A direct-looking alternative takes 5 moves but crosses one cell with added risk cost 4. Which has lower stated cost if each move costs 1?",
      steps: [
        "Detour cost = 7 moves × 1 = 7.",
        "Risky path cost = 5 move cost + 4 risk cost = 9.",
        "Geometric lengths are 0.7 m and 0.5 m, but the objective includes the declared risk penalty.",
      ],
      result: "The 7-step detour is cheaper under this cost model, 7 versus 9, even though it is 0.2 m longer.",
      sanityCheck: "Without the risk penalty the 5-step path would win; the reversal comes entirely from an explicit, inspectable design weight.",
    },
    exercise: {
      question: "Why inflate obstacles before grid planning for a circular robot?",
      choices: [
        "To make the map look higher resolution",
        "To convert body-clearance constraints into a point-center planning problem",
        "To eliminate localization uncertainty automatically",
        "To guarantee the motors can follow every grid corner",
      ],
      answerIndex: 1,
      explanation: "Inflation marks center positions that would put the robot body in collision. It does not improve map resolution, remove pose uncertainty, or enforce vehicle dynamics; extra margin and trajectory feasibility still require separate treatment.",
    },
    lab: {
      goal: "Trace A* on a tabletop grid and expose how footprint inflation changes feasible routes.",
      equipment: ["Graph paper or printed 10 × 10 grid", "coins or blocks as obstacles", "cardboard robot footprint", "pencil", "calculator or short script"],
      steps: [
        "Define four-neighbor moves of cost 1, start, goal, and occupied cells; state how unknown cells are treated.",
        "Run A* using Manhattan h and record each expanded cell’s g, h, and parent until the goal is reached.",
        "Trace the resulting center path with the cardboard footprint and identify any body collision.",
        "Inflate obstacles by the footprint radius in cells and replan.",
        "Introduce a deliberate fault by using h = 3 × Manhattan distance; compare expansion/order and note that optimality is no longer guaranteed, then restore admissible h.",
      ],
      observe: [
        "Expected: inflation removes center cells whose footprints would overlap an obstacle and may lengthen or eliminate the route.",
        "Record actual expanded-node order and path cost for both maps; a predicted shortest path is not physical clearance evidence.",
        "Expected fault diagnostic: an overestimating heuristic may rush toward the goal and can return a higher-cost path on a suitable map.",
      ],
      transfer: "For a vacuum-like bench robot, define a cost for distance, an unknown-space policy, and a replanning trigger when a movable chair appears; do not treat it as an appliance-equivalent design.",
      cautions: ["Keep this lab unpowered or use a stationary simulator; any later moving test needs low speed, a clear area, and an independent stop."],
    },
    projectIds: ["desk-robot", "blank"],
    glossary: ["path-planning", "cost-map", "heuristic", "astar", "obstacle-inflation", "replanning"],
    sources: [modernRobotics],
  },
  {
    id: "system-integration",
    track: "robotics",
    title: "System integration by interfaces",
    summary: "Bring subsystems together in staged increments, using budgets and interface tests to catch cross-domain failures before a full robot run.",
    minutes: 75,
    level: "Advanced",
    prerequisites: ["engineering-workflow", "voltage-current-resistance", "programming-state", "power-regulation"],
    relatedStudy: ["planning-navigation", "robot-architecture", "firmware-debugging"],
    outcomes: [
      "Plan a staged integration sequence, compute timing and power margins, and isolate a failure at an electrical, data, timing, mechanical, or behavioral interface.",
    ],
    concepts: `Integration is where individually correct parts meet assumptions they did not know they had. A camera works on USB, motors work on a bench supply, and a screen works alone—then the combined robot resets when the wheels start. The useful response is not “integration is mysterious,” but an inventory of interfaces and budgets.

Each interface has a contract: connector and voltage, units and frame, update rate and latency, mechanical datum, ownership, startup order, and fault response. Budgets add system-wide demand. If electronics draw 0.7 A, two motors may each draw 1.2 A at the tested peak, and a margin factor is 1.25, the source path should be assessed for at least (0.7 + 2.4) × 1.25 = 3.875 A over the relevant duration. This calculation is not permission to ignore motor stall current, battery protection, connector rating, or transient voltage drop.

Integrate in thin vertical slices. First prove protected power and idle current. Then establish communication with actuators disabled. Exercise one motor with wheels raised, then sensing, then closed-loop low-speed motion, then planning. At each stage save a known-good checkpoint and acceptance evidence. A practical build decision is to add test points and log supply minimum, command age, reset cause, and subsystem heartbeat before packaging hides access.

A common misconception is that passing every subsystem test implies the assembled system will pass. Shared power impedance, CPU load, electromagnetic coupling, cable strain, coordinate assumptions, and scheduler contention appear only in combination. Another failure is connecting everything and debugging from the final symptom. Use a dependency-ordered matrix and change one connection or load at a time. Expected budgets are predictions; actual current, latency, and temperature require measurements with stated conditions. Never bypass fuses, guards, or current limits merely to make an integration test proceed.`,
    workedExample: {
      problem: "A 5 V rail supplies a processor at 450 mA, camera at 320 mA, screen at 180 mA, and sensor peak at 70 mA. Add 30% margin and assess a 1.5 A regulator from current alone.",
      steps: [
        "Peak listed load = 0.450 + 0.320 + 0.180 + 0.070 = 1.020 A.",
        "With 30% margin, design current = 1.020 × 1.30 = 1.326 A.",
        "A 1.5 A rating exceeds 1.326 A by 0.174 A, but thermal derating, input voltage, transient response, wiring drop, and startup peaks remain unverified.",
      ],
      result: "The regulator passes this current-only paper check with 174 mA headroom; it is not yet validated for the integrated build.",
      sanityCheck: "The margin adds 306 mA to 1.020 A, yielding 1.326 A, which is below but close to 1.5 A.",
    },
    exercise: {
      question: "A robot resets only when camera streaming and both motors run together. All three pass alone. What is the strongest next test?",
      choices: [
        "Randomly replace software modules until resets stop",
        "Capture supply voltage minimum, current, reset cause, and command timing while adding loads one at a time from a known-good state",
        "Bypass current protection to prevent shutdown",
        "Assume the camera library is wrong because streaming is visible",
      ],
      answerIndex: 1,
      explanation: "Staged load addition with synchronized electrical and software evidence tests shared-power and timing hypotheses while preserving a baseline. Random replacement changes too many variables. Bypassing protection is unsafe and destroys useful evidence. The symptom does not uniquely identify the camera library.",
    },
    lab: {
      goal: "Integrate sensor, display/logging, and output mock-up through explicit acceptance gates.",
      equipment: ["Protected low-voltage supply", "microcontroller", "sensor or potentiometer", "LED output or safely driven motor", "multimeter", "serial console"],
      steps: [
        "Write interface contracts and acceptance checks for power, sample message, display/log update, output command, and watchdog.",
        "Measure idle supply voltage/current, then add sensor sampling and logging before enabling the output stage.",
        "Enable a current-limited LED or raised-wheel motor test and record supply minimum, loop cadence, and command age.",
        "Introduce a deliberate fault by changing the sensor unit label while preserving its numeric value; use the contract check to reject it, then restore the unit.",
        "Stop upstream commands and verify the local output watchdog independently of the screen/logger.",
      ],
      observe: [
        "Expected: every stage meets its own acceptance check before the next load or interface is enabled.",
        "Record actual voltage, current, cadence, and watchdog latency at each stage rather than substituting calculated budgets.",
        "Expected fault signature: a unit-contract failure is detected before a plausible number reaches actuation.",
      ],
      transfer: "Create an integration order for a small printer analogue with a carriage, limit switch, and status screen, including the checkpoint before powered motion.",
      cautions: ["Power off before rewiring, use current limiting and protected low voltage, raise or mechanically restrain moving parts, and retain all protection during faults."],
    },
    projectIds: ["sensor", "desk-robot", "cyberdeck"],
    glossary: ["integration", "interface-contract", "power-budget", "latency-budget", "heartbeat", "acceptance-test"],
    sources: [designCourse, controlTutorials, continuityGuide],
  },
  {
    id: "reliability-faults",
    track: "robotics",
    title: "Reliability and fault response",
    summary: "Identify credible faults, detect them independently where possible, and choose bounded degraded or safe responses instead of promising fault-free operation.",
    minutes: 70,
    level: "Advanced",
    prerequisites: ["experimental-method", "robot-architecture"],
    relatedStudy: ["system-integration", "batteries-protection"],
    outcomes: [
      "Build a fault-response table, estimate simple series reliability, and verify that one seeded low-energy fault becomes detectable and leads to a defined state.",
    ],
    concepts: `Reliability is the probability that a system performs its required function under stated conditions for a stated time. Safety asks about unacceptable harm; availability asks whether service is ready. They overlap but are not synonyms. A robot can be safely stopped yet unavailable, or highly available while hiding a hazardous failure. Requirements need operating conditions and time horizon rather than adjectives such as “robust.”

A fault is a cause, an error is an incorrect internal state, and a failure is externally incorrect service. A loose encoder connector is a fault; a frozen wheel count is an error; driving the wrong distance is a failure. A fault-response table lists cause, observable symptom, detection, reaction, recovery, and retained evidence. For independent series elements whose success probabilities are R1 and R2, combined success is R = R1R2. Two elements each at 0.99 yield 0.9801, showing that adding required parts can reduce mission reliability. Independence is a strong assumption, not a free fact.

Detection should use independent evidence when practical. A commanded motor with zero encoder change could mean a disconnected encoder, stalled wheel, or driver problem; current and inertial motion can separate hypotheses. The build decision might be: if command exceeds 20% for 300 ms while encoder count stays unchanged, command zero and latch DRIVE_FAULT. Threshold and delay must reject normal startup yet respond before damage, using tested bounds.

A common misconception is that redundancy automatically improves reliability. Two sensors sharing one connector, supply, algorithm, or environmental weakness can fail together; voting also introduces logic and diagnostic complexity. Another failure is automatically resetting faults so quickly that evidence disappears or motion resumes into the same condition. Prefer bounded energy, explicit safe or degraded states, latched cause records, and deliberate recovery criteria. Do not create destructive faults to test them: inject messages, disconnect only unpowered low-voltage signals, or use simulation and current limits.`,
    workedExample: {
      problem: "A mission requires a controller (R = 0.995), motor driver (0.990), and encoder (0.985), treated as independent series elements. Estimate mission success probability.",
      steps: [
        "Multiply the controller and driver reliability: 0.995 × 0.990 = 0.98505.",
        "Include the encoder: 0.98505 × 0.985 = 0.97027425.",
        "Estimated failure probability for at least one required element is 1 - 0.97027425 = 0.02972575, about 2.97%.",
      ],
      result: "Under the stated independence and mission definitions, estimated system reliability is about 97.03%.",
      sanityCheck: "Series reliability is lower than the least-reliable component’s 98.5%, as it must be when every component is required.",
    },
    exercise: {
      question: "Two identical distance sensors share one supply and face the same glossy surface. Why is treating their failures as independent questionable?",
      choices: [
        "Because two sensors can never improve a system",
        "Because common power and environmental conditions can cause correlated failures in both channels",
        "Because reliability multiplication always produces a number above one",
        "Because software cannot compare two values",
      ],
      answerIndex: 1,
      explanation: "A supply fault or shared optical weakness can defeat both sensors together, violating the independence assumption. Redundancy may still help against some faults, but its architecture and diversity matter. Probability products remain at or below one, and comparison logic is possible though itself fallible.",
    },
    lab: {
      goal: "Verify a safe, observable response to a seeded sensor-staleness fault.",
      equipment: ["Microcontroller", "LED output or restrained low-voltage robot", "sensor or synthetic data source", "serial console", "timer"],
      steps: [
        "Write a table for stale sensor data: detection threshold, safe output, latched evidence, and explicit recovery condition.",
        "Run fresh timestamped samples at 20 Hz and enable a bounded LED duty or raised-wheel motion command.",
        "Introduce a deliberate fault by pausing sample publication in software; do not short or overvoltage hardware.",
        "Measure time from last fresh sample to fault detection and output-zero command; verify the cause remains logged after recovery.",
        "Repeat with one late sample below the threshold and a sustained pause above it to examine nuisance-trip tradeoffs.",
      ],
      observe: [
        "Expected: data age crosses the threshold, the system enters a named fault state, and bounded output goes to zero.",
        "Record actual last-sample, detection, and output timestamps separately from the configured threshold.",
        "Expected diagnostic: a short allowed delay does not latch, while the sustained pause does; actual boundary behavior must be measured.",
      ],
      transfer: "Draft fault responses for a camera occlusion, one stuck wheel, and a low battery, distinguishing continue-degraded, stop, and operator-recovery decisions.",
      cautions: ["Inject software or unpowered low-voltage connector faults only; keep motion restrained and never test protection by defeating it or intentionally overheating/stalling hardware."],
    },
    projectIds: ["desk-robot", "sensor"],
    glossary: ["reliability", "fault", "error-state", "failure", "common-cause", "degraded-mode"],
    sources: [designCourse, controlTutorials],
  },
  {
    id: "documentation-sharing",
    track: "robotics",
    title: "Documentation as reproducible evidence",
    summary: "Package requirements, decisions, interfaces, versions, and measured evidence so another builder can reproduce a result and challenge its limits.",
    minutes: 55,
    level: "Advanced",
    prerequisites: ["engineering-workflow", "experimental-method"],
    relatedStudy: ["reliability-faults"],
    outcomes: [
      "Produce a compact build packet that separates requirements, calculations, expected behavior, measurements, anomalies, and unresolved risks.",
    ],
    concepts: `A build is shareable when another person can understand what was attempted, reconstruct the relevant configuration, and distinguish evidence from belief. Photos and polished prose help, but they do not replace part identity, firmware version, wiring, parameters, units, procedure, and raw observations. Documentation is part of the technical interface between today’s builder and tomorrow’s debugger.

A useful packet starts with scope and a testable requirement: “stop the restrained wheels within 150 ms of command loss,” not “make it safe.” It includes an architecture diagram, bill of materials with exact manufacturer/model where known, schematic or pin table, mechanical dimensions, software revision, setup commands, calibration, and test records. Each record pairs expected and actual results. A result such as 112 ms needs conditions, sample count, instrument resolution, and links to logs; it is not universal certification.

Decision records preserve alternatives and reasons. Choosing a 330 Ω LED resistor should show supply, assumed forward voltage, target current, calculation, and verification. Interface tables name units, frames, rates, valid ranges, timeouts, and fault behavior. For source sharing, pin dependencies and versions rather than saying “install the usual library.” Use portable formats and relative links, while keeping raw machine-readable data beside plots.

A common misconception is that more documentation means more reproducibility. Hundreds of unlabeled screenshots can bury the one configuration that matters. Another failure is editing out unsuccessful trials, which prevents others from understanding variability and false starts. Include anomalies, deviations, and unknowns explicitly. Do not invent purchase availability, measurements, or evidence to complete a template. Redact credentials and personal information, check licenses before redistributing third-party material, and identify bench analogues honestly: a small blower experiment is not a certified vacuum cleaner, and a model vehicle is not roadworthy.`,
    workedExample: {
      problem: "Five watchdog trials measure 108, 111, 109, 115, and 112 ms from last command to zero output. Summarize the evidence against a 150 ms requirement without overstating it.",
      steps: [
        "Mean = (108 + 111 + 109 + 115 + 112) / 5 = 111 ms.",
        "Observed minimum is 108 ms and maximum is 115 ms, so observed range is 7 ms.",
        "All five observed trials are below 150 ms, with 35 ms margin from the worst observed result to the limit.",
        "Record hardware/software versions, load, clock method, and instrument resolution; five trials do not prove all future conditions pass.",
      ],
      result: "Report: 5/5 trials passed under the documented setup; mean 111 ms, observed range 108–115 ms, worst observed margin 35 ms.",
      sanityCheck: "The mean lies within the observed range and the worst-case margin is 150 - 115 = 35 ms, not 39 ms from the mean.",
    },
    exercise: {
      question: "Which statement belongs in a defensible shared test report?",
      choices: [
        "The robot is completely safe because one bench test passed",
        "Expected timeout was 100 ms; five measured command-to-zero results were 108–115 ms under the listed restrained-wheel setup",
        "The current was probably fine, so no instrument or calculation is needed",
        "A product page photo proves the exact installed part model",
      ],
      answerIndex: 1,
      explanation: "The second statement separates configuration, expectation, actual measurements, sample count, and conditions. One passing setup cannot establish complete safety. “Probably” is not current evidence, and appearance alone may not establish part identity.",
    },
    lab: {
      goal: "Create and peer-check a reproducible mini build packet for one low-voltage subsystem.",
      equipment: ["Completed sensor, LED, or restrained motor subsystem", "multimeter or timing instrument", "camera optional", "text editor", "exportable raw log"],
      steps: [
        "State one bounded requirement and inventory exact hardware, wiring, firmware revision, parameters, and tools.",
        "Add one design calculation, one interface table, and a procedure another person could follow without oral context.",
        "Run at least three trials and keep raw observations; label expected values separately from actual measurements.",
        "Introduce a deliberate documentation fault by removing one critical unit or pin reference; ask a reader to identify the ambiguity, then repair it.",
        "Export or print the packet and inspect links, diagrams, code wrapping, secret removal, and whether unknowns remain visible.",
      ],
      observe: [
        "Expected: a reader can identify the exact setup, repeat the procedure, and tell calculations from measurements.",
        "Record actual reader questions and reproduction differences as evidence about documentation quality.",
        "Expected fault signature: removing a unit or pin makes at least one step admit multiple interpretations; the reader’s actual response may reveal additional gaps.",
      ],
      transfer: "Prepare a one-page comparison showing how a fan, vacuum blower, printer carriage, screen, toy car, or camera inspired the bench subsystem while clearly listing capabilities not reproduced.",
      cautions: ["Remove API keys, Wi-Fi credentials, personal paths, and location data before sharing; document appliances from external observation or manufacturer information, never energized disassembly."],
    },
    projectIds: ["sensor", "linkage", "desk-robot", "cyberdeck", "blank"],
    glossary: ["reproducibility", "traceability", "decision-record", "test-condition", "observed-range", "provenance"],
    sources: [missingSemester, designCourse],
  },
];
