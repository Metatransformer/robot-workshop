import type { LearningSource } from "./curriculum/types";

export type EverydaySubsystem = {
  name: string;
  purpose: string;
  energyOrSignal: string;
  whatToObserve: string;
};

export type EverydayExperiment = {
  goal: string;
  materials: string[];
  steps: string[];
  predict: string;
  observe: string[];
  diagnose: string[];
  limits: string[];
};

export type EverydayObject = {
  id: "vacuum" | "display" | "electric-car" | "washer" | "thermostat" | "barrier";
  title: string;
  question: string;
  summary: string;
  subsystems: EverydaySubsystem[];
  energyFlow: string[];
  informationFlow: string[];
  prerequisites: string[];
  experiment: EverydayExperiment;
  proposedBuild: string;
  supplierIds: string[];
  sources: LearningSource[];
};

const source = (title: string, url: string): LearningSource => ({ title, url });

export const everydayObjects: EverydayObject[] = [
  {
    id: "vacuum",
    title: "Vacuum cleaner",
    question: "How does electrical power become moving air—and why does a blocked filter change the sound and pickup?",
    summary: "A vacuum cleaner is an energy-conversion chain, not a box that creates suction. A motor spins an impeller, the impeller adds energy to air, and the resulting pressure difference drives flow through the nozzle, duct, separator, filter, and exhaust. Restrictions and leaks move the whole system to a different pressure/flow operating point, while most input energy ultimately becomes heat and sound.",
    subsystems: [
      { name: "Electrical supply and control", purpose: "Delivers power and selects operating state.", energyOrSignal: "Electrical energy plus on/off or level command.", whatToObserve: "From outside, note control positions, cord or battery information, startup behavior, and whether sound changes between settings." },
      { name: "Motor and impeller", purpose: "Convert electrical power to shaft motion and then add pressure and velocity to air.", energyOrSignal: "Electrical → rotational mechanical → moving-air energy, with heat and sound losses.", whatToObserve: "Listen at a safe distance for startup, steady running, and the change caused by a permitted external restriction; never reach into an inlet." },
      { name: "Nozzle, duct, separator, and filter", purpose: "Guide airflow, separate debris, and retain particles while passing air.", energyOrSignal: "Pressure difference drives flow; drag dissipates useful pressure as turbulence and heat.", whatToObserve: "With the appliance off, inspect accessible external nozzle geometry and documented filter path; compare clean/blocked indicators only as the manual allows." },
      { name: "Exhaust and housing", purpose: "Return filtered air, cool components, contain rotating parts, and manage noise.", energyOrSignal: "Airflow and waste heat leave through the designed exhaust path.", whatToObserve: "Locate external exhaust vents and feel airflow only where normal use permits, without covering cooling openings." },
    ],
    energyFlow: ["Electrical supply", "Motor torque", "Impeller rotation", "Air pressure and flow", "Nozzle-to-filter air path", "Exhaust, heat, and sound"],
    informationFlow: ["User control", "Power controller", "Motor operating state", "Audible/airflow cues to user"],
    prerequisites: ["voltage-current-resistance", "power-regulation", "forces-free-body", "friction-efficiency", "experimental-method"],
    experiment: {
      goal: "Map how a safe, low-voltage fan-and-duct analogue responds to external flow resistance.",
      materials: ["Guarded 5 V cooling fan", "Current-limited suitable 5 V supply", "Cardboard duct", "Tape", "Fixed paper streamers", "Several removable paper screens with different open areas"],
      steps: [
        "Keep the fan guard fitted and fasten the fan and duct so fingers, hair, wires, and loose paper cannot reach the blades.",
        "Before power, draw the expected energy path and predict which streamer will move most with no screen fitted.",
        "Power the fan from its validated supply, observe from outside the duct, and record streamer deflection and sound.",
        "Switch power off before changing one external paper screen. Re-power, record the same observations, then repeat for each screen.",
        "Compare results with the prediction and distinguish reduced flow, leakage around the screen, and a shifted fan operating point.",
      ],
      predict: "Rank the screen configurations by expected airflow before the test, and predict whether added restriction will change both streamer deflection and fan sound.",
      observe: ["Relative streamer deflection at fixed positions", "Direction of flow and visible leakage", "Qualitative sound change", "Whether repeated trials agree"],
      diagnose: ["No motion: disconnect power, then check supply, connector polarity, and whether the fan is mechanically obstructed.", "Unexpected weak flow: look for duct leaks, reversed fan direction, collapsed cardboard, or an overly restrictive screen.", "Changing results: restore identical streamer and screen positions before blaming the fan."],
      limits: ["The cooling fan is not a vacuum blower and must not be described as one.", "Use no dust, liquids, sealed inlet, blade access, mains wiring, or appliance teardown.", "The analogue does not establish filtration, suction performance, motor safety, or household-product equivalence."],
    },
    proposedBuild: "Proposed, unvalidated bench exercise: a guarded 5 V cooling fan in a cardboard duct with fixed paper streamers and removable screens. It is an airflow concept model—not a vacuum cleaner, household-equivalent product, or completed BOM.",
    supplierIds: ["fan3368"],
    sources: [source("Dyson — Filtration at Dyson", "https://www.dyson.com/discover/innovation/behind-the-invention/filtration-at-dyson")],
  },
  {
    id: "display",
    title: "Television and pixel display",
    question: "How does stored image data become controlled light at millions of pixel locations?",
    summary: "A digital display separates information processing from light production. A processor builds pixel values in a framebuffer and a display interface/driver scans those values into rows and columns. An LCD modulates a separate backlight through liquid-crystal cells and color filters; an OLED pixel emits its own light. Controls and audio are parallel paths. The bench analogue demonstrates a small framebuffer and pixel addressing, not a television input pipeline or HDMI implementation.",
    subsystems: [
      { name: "Power conversion", purpose: "Creates the regulated rails used by logic, drivers, light source, and audio.", energyOrSignal: "Input electrical energy → several regulated electrical rails → light, sound, and heat.", whatToObserve: "Use labels and product documentation to identify rated input and heat/vent locations; do not open or probe a television." },
      { name: "Processor and framebuffer", purpose: "Decode or generate content and store the value intended for each pixel before scanout.", energyOrSignal: "Encoded information → pixel values in memory → timed pixel stream.", whatToObserve: "Change menus or a paused test image and distinguish content changes from panel brightness changes." },
      { name: "Display timing and driver", purpose: "Address pixel rows/columns with the required timing and electrical drive.", energyOrSignal: "Clock, row/column addresses, and pixel data become panel drive signals.", whatToObserve: "A phone slow-motion recording may reveal scan or refresh artifacts, but absence of visible bands proves nothing about implementation." },
      { name: "LCD or OLED panel", purpose: "Turn addressed pixel values into spatially controlled light.", energyOrSignal: "LCD: backlight energy filtered/modulated by pixels. OLED: electrical energy converted to light at each emissive pixel.", whatToObserve: "Compare black level and off-axis appearance without claiming those observations alone identify every panel technology." },
      { name: "Controls and audio", purpose: "Receive user commands and turn a separate audio stream into pressure waves.", energyOrSignal: "Button/remote signals → system state; digital audio → amplifier → speaker motion → sound.", whatToObserve: "Change volume while holding the image constant, then change brightness while holding audio constant, to reveal parallel paths." },
    ],
    energyFlow: ["Electrical input", "Regulated rails", "Processor and display driver", "Backlight through LCD or emissive OLED pixels", "Visible light and waste heat"],
    informationFlow: ["Content and user command", "Processor", "1024-byte monochrome framebuffer in the analogue", "Display interface and driver", "Addressed pixels"],
    prerequisites: ["digital-interfaces", "data-structures", "communications-protocols", "programming-state", "mcu-gpio"],
    experiment: {
      goal: "Generate a checkerboard in a 128 × 64 monochrome framebuffer and explain how bytes map to visible pixels.",
      materials: ["Original Raspberry Pi Pico", "Adafruit 128 × 64 monochrome OLED breakout", "Data-capable Micro-USB cable", "Compatible jumpers and headers", "Current manufacturer documentation"],
      steps: [
        "Verify the exact OLED board revision, selected interface, pin labels, voltage requirements, and Pico wiring before applying power.",
        "On paper, calculate 128 × 64 ÷ 8 = 1024 bytes for a one-bit-per-pixel framebuffer and predict the effect of changing one byte.",
        "Create alternating pixel blocks in a 1024-byte buffer, send it using a documented library for the selected interface, and record the result.",
        "Change block size or invert the buffer, then separate a data-layout error from an electrical/interface error using one change at a time.",
      ],
      predict: "Sketch the expected checkerboard and identify which spatial region should change when a selected group of framebuffer bits is inverted.",
      observe: ["Whether every row and column is addressed", "Pattern orientation and byte-to-pixel ordering", "Effect of inversion", "Repeatability after reset"],
      diagnose: ["Blank display: remove power, then re-check board revision, power, ground, interface selection, address, and wiring.", "Scrambled geometry: inspect buffer indexing, width/height assumptions, and library configuration.", "Correct shape but reversed light/dark: check bit meaning or inversion configuration rather than rewiring."],
      limits: ["This does not implement or claim HDMI, video decoding, color processing, LCD driving, or television timing.", "The OLED is emissive; it does not model an LCD backlight and shutter stack.", "No television teardown or energized probing is part of the exercise."],
    },
    proposedBuild: "Proposed, unvalidated bench exercise: an original Pico writes a checkerboard into a 1024-byte monochrome framebuffer and sends it to a documented OLED breakout. It is a pixel-addressing model—not a television, HDMI implementation, household-equivalent product, or completed BOM.",
    supplierIds: ["originalPico", "OLED326"],
    sources: [source("Samsung Semiconductor — LED backlight unit glossary", "https://semiconductor.samsung.com/support/tools-resources/dictionary/semiconductor-glossary-leds-blu/")],
  },
  {
    id: "electric-car",
    title: "Electric car",
    question: "How do stored electrical energy, driver commands, feedback, and thermal limits combine to move a vehicle?",
    summary: "An electric vehicle coordinates several paths: a traction battery stores energy, power electronics meter it into a motor, gearing trades speed for wheel torque, and tire forces accelerate the vehicle. Sensors and controllers translate pedal commands into torque while monitoring wheel speed, battery state, temperature, isolation, and faults. Charging and thermal management are major systems of their own. Observation here stays external; no high-voltage access, battery-pack work, lifting, or safety-system bypass is required.",
    subsystems: [
      { name: "Traction battery and protection", purpose: "Store high-voltage energy and constrain operation when voltage, current, isolation, or temperature is unsafe.", energyOrSignal: "Chemical → DC electrical energy; monitoring signals report cell and pack condition.", whatToObserve: "Read official architecture and charging documentation; externally note indicated state of charge and range changes only during normal use." },
      { name: "Inverter and motor", purpose: "Convert battery DC into controlled motor phase currents and electromagnetic torque.", energyOrSignal: "DC electrical → controlled electrical waveforms → rotor torque, heat, and sound.", whatToObserve: "From a passenger-safe position, compare acceleration command, audible response, and energy display without inferring hidden switching details." },
      { name: "Reduction gear, differential, and wheels", purpose: "Transmit motor torque at useful wheel speed and allow driven wheels to turn appropriately.", energyOrSignal: "Motor speed/torque → geared axle torque → tire-road force → vehicle kinetic energy.", whatToObserve: "Use diagrams and externally visible wheel motion; never work beneath or near a vehicle that is capable of moving." },
      { name: "Vehicle control and sensing", purpose: "Interpret commands, coordinate torque and braking, and enter safe states on detected faults.", energyOrSignal: "Pedal and sensor signals → control decisions → torque/brake commands → measured response feedback.", whatToObserve: "Map dashboard state transitions and documented alerts during ordinary operation; do not trigger faults or defeat interlocks." },
      { name: "Charging and thermal management", purpose: "Move energy into the battery and move heat away from the battery, motor, inverter, and cabin.", energyOrSignal: "Grid electrical energy → charger → battery; pumps/fans move thermal energy to ambient air.", whatToObserve: "Observe only normal external charge indications and documented fan/pump behavior; connectors remain closed and unmodified." },
    ],
    energyFlow: ["Traction battery", "Inverter", "Motor", "Reduction gear and differential", "Wheels and tire force", "Vehicle motion, heat, and drag"],
    informationFlow: ["Pedal/setpoint command", "Vehicle controller", "Inverter torque command", "Motor and wheel response", "Speed/current/temperature feedback and limits"],
    prerequisites: ["batteries-protection", "motor-drivers", "torque-gearing", "feedback-pid", "reliability-faults", "system-integration"],
    experiment: {
      goal: "Measure how command level and surface load affect the travel of a low-voltage tabletop cart with a defined stop condition.",
      materials: ["Low-voltage brushed-motor tabletop cart", "Battery holder using individually protected consumer cells or a current-limited bench supply", "Compatible motor driver", "Original Pico", "Tape measure", "Stop block", "Clear tabletop test lane"],
      steps: [
        "Use only a purpose-built low-voltage cart; document supply voltage, motor type, driver limits, polarity, and an accessible power disconnect.",
        "Raise the drive wheels with power disconnected and verify free motion, wiring retention, direction, and the command that produces stop.",
        "Mark a clear lane with a physical catch zone, predict travel time at two bounded commands, and keep people clear.",
        "Run one command level at a time, measure distance and time, then repeat on one different benign surface.",
        "Disconnect power before inspection and compare measured response with the prediction and stop behavior."],
      predict: "Predict how a higher bounded command and a higher-drag surface will change travel time, stopping distance, and motor heating trend.",
      observe: ["Travel time over a fixed distance", "Straightness and wheel slip", "Stop response", "Qualitative motor/driver temperature only after power is disconnected"],
      diagnose: ["No motion: disconnect power and check the low-voltage supply, driver enable/state, motor connection, and mechanical binding.", "Veering: compare wheel contact, alignment, friction, and motor response before changing code.", "Unreliable stop: end the experiment and fix the command/state logic and physical catch zone before another powered run."],
      limits: ["Do not open an EV, access orange/high-voltage wiring, rebuild a battery pack, lift a vehicle, or bypass any interlock or safety system.", "The tabletop cart does not model roadworthiness, regenerative braking, crash safety, high-voltage isolation, or EV thermal loads.", "Candidate parts require a separate electrical and mechanical review; this is not a completed BOM."],
    },
    proposedBuild: "Proposed, unvalidated bench exercise: a low-voltage tabletop brushed-motor cart with bounded speed commands, measured travel, and a physical catch zone. It is a control-and-energy analogue—not an electric vehicle, roadworthy product, household-equivalent system, or completed BOM.",
    supplierIds: ["originalPico", "DRV8833-3297"],
    sources: [source("U.S. Department of Energy — How all-electric cars work", "https://afdc.energy.gov/vehicles/how-do-all-electric-cars-work")],
  },
  {
    id: "washer",
    title: "Washing machine",
    question: "How does a washer coordinate water, drum motion, locks, sensing, and faults into a safe cycle?",
    summary: "A washer is best understood as a state machine coordinating physical subsystems. Requested cycle, door state, water level, temperature, speed, imbalance, and time determine transitions among lock, fill, agitate, drain, and spin. Energy reaches valves, heater (where fitted), pump, and motor through controlled power stages. The analogue stays dry: LEDs represent water states and a cardboard drum represents motion, so no mains, plumbing, wet electronics, or appliance opening is needed.",
    subsystems: [
      { name: "Cycle controller", purpose: "Sequence states, check transition conditions, command outputs, and time out missing responses.", energyOrSignal: "User selection and sensor inputs → state logic → actuator commands and status.", whatToObserve: "During an ordinary cycle, record visible state indications and elapsed transitions from outside without defeating the lid/door." },
      { name: "Door or lid interlock", purpose: "Report closure/lock state and constrain hazardous motion or water states.", energyOrSignal: "Position/lock signal enters the controller; controller permits or inhibits later commands.", whatToObserve: "Observe only documented normal behavior; never bypass the switch or force the lock." },
      { name: "Fill and drain path", purpose: "Admit, contain, sense, and remove water.", energyOrSignal: "Electrical commands operate valves/pump; water pressure and gravity move fluid; level signal closes the loop.", whatToObserve: "Listen for ordinary fill/drain phases and watch external indicators and drain outlet only as installation guidance permits." },
      { name: "Drive, drum, and suspension", purpose: "Apply bounded torque for tumbling and spin while containing loads and managing imbalance.", energyOrSignal: "Electrical → motor torque → belt/direct drive → drum and load motion → heat, vibration, and sound.", whatToObserve: "Compare slow tumble and spin from outside; note vibration without touching or moving an operating machine." },
      { name: "Fault handling and user feedback", purpose: "Stop or restrict the cycle when expected signals do not arrive and communicate what needs attention.", energyOrSignal: "Timers and sensor disagreement → fault state → outputs off/safe plus code, light, or tone.", whatToObserve: "Use documented error descriptions; do not manufacture blocked drains, imbalance, or lock faults on a household machine." },
    ],
    energyFlow: ["Electrical supply and water pressure", "Controlled valve/pump/motor power", "Water movement and drum torque", "Garment/water motion", "Drain flow, vibration, sound, and heat"],
    informationFlow: ["Cycle choice", "Door/level/speed/time inputs", "State machine", "Valve/pump/motor commands", "Observed next state or fault timeout"],
    prerequisites: ["programming-state", "timers-pwm", "motor-drivers", "interrupts-scheduling", "reliability-faults"],
    experiment: {
      goal: "Implement and inspect a dry washer state model with explicit guards and a missing-signal timeout.",
      materials: ["Cardboard drum turned by hand", "Original Raspberry Pi Pico", "Three LEDs with appropriate resistors", "Momentary buttons for door and level signals", "Breadboard and verified jumpers", "State-transition worksheet"],
      steps: [
        "Draw states for idle, lock, fill, tumble, drain, spin, complete, and fault; label every transition condition before wiring.",
        "Wire only the low-voltage buttons and LEDs using verified Pico pins and suitable resistors; the hand-turned drum has no powered drive.",
        "Predict outputs for a normal input sequence, then step through it and record state, inputs, outputs, and elapsed time.",
        "Repeat while withholding the simulated level signal and confirm the model enters fault after its defined timeout with outputs inactive.",
        "Open the simulated door input in each non-hazardous dry state and compare behavior with the transition table."],
      predict: "Write the expected state and active LED after each input, including the exact state reached when the simulated level signal never arrives.",
      observe: ["State sequence and dwell time", "Whether outputs match the current state", "Response to door input", "Timeout and recovery behavior"],
      diagnose: ["Skipped state: inspect transition guards and button debouncing before changing the diagram.", "State never exits: check the simulated input level and timer update path.", "Unsafe output persists in fault: make the fault state deactivate outputs first, then repeat the dry test."],
      limits: ["This is a dry state model: LEDs represent water states, and the drum is hand-turned cardboard.", "Do not connect to mains, water valves, pumps, heaters, or an appliance; do not bypass a washer lid/door lock.", "The exercise does not validate appliance safety, load balancing, waterproofing, or a real motor power stage."],
    },
    proposedBuild: "Proposed, unvalidated bench exercise: a dry Pico state model with buttons for door/level, LEDs for water and drive states, a hand-turned cardboard drum, and a fault timeout. It is not a washing machine, household-equivalent product, safety controller, or completed BOM.",
    supplierIds: ["originalPico"],
    sources: [source("Texas Instruments — Washing machine control reference design", "https://www.ti.com/lit/ug/tidu466/tidu466.pdf")],
  },
  {
    id: "thermostat",
    title: "Thermostat",
    question: "How can one temperature measurement produce stable on/off behavior instead of rapid chatter?",
    summary: "A thermostat closes an information-feedback loop: a sensor estimates temperature, the controller compares it with a setpoint, and an output requests heating or cooling. The environment changes slowly, so the next measurement reflects the result after delay. Hysteresis—different turn-on and turn-off thresholds—prevents rapid switching near the setpoint. A real building adds electrical ratings, equipment modes, minimum run times, fail-safe behavior, installation rules, and professional commissioning that the LED analogue does not provide.",
    subsystems: [
      { name: "Temperature sensor", purpose: "Convert local physical temperature into a measurement with finite accuracy and response time.", energyOrSignal: "Ambient heat affects sensor; digital measurement enters the controller.", whatToObserve: "Compare displayed temperature with location, drafts, sunlight, occupancy, and time rather than assuming it equals every room surface." },
      { name: "Setpoint and mode input", purpose: "Capture the desired threshold and heating/cooling/off intent.", energyOrSignal: "User command becomes a stored setpoint and operating mode.", whatToObserve: "Change one setting during normal use and note requested versus measured temperature and any delayed response." },
      { name: "Comparator and state logic", purpose: "Calculate error, apply hysteresis and timing rules, and choose an output state.", energyOrSignal: "Measurement + setpoint + prior state → heat/cool/off request.", whatToObserve: "Record the points where an indicator turns on and off; different thresholds reveal hysteresis." },
      { name: "HVAC output and environment", purpose: "A real system safely commands separate equipment that transfers thermal energy; the room feeds a new measurement back.", energyOrSignal: "Control request → HVAC energy transfer → room temperature change → sensor feedback.", whatToObserve: "Use documentation and normal indicators only; do not access building wiring, combustion equipment, or refrigerant systems." },
    ],
    energyFlow: ["Building energy source", "Heating/cooling equipment", "Thermal transfer to or from room", "Walls, air, and contents", "Stored heat and losses to outdoors"],
    informationFlow: ["Temperature sensor and setpoint", "Error plus prior state", "Hysteresis/timing logic", "LED request in the analogue", "Changed environment returns to sensor"],
    prerequisites: ["measurement-instruments", "adc-sampling", "signals-systems", "feedback-pid", "programming-state"],
    experiment: {
      goal: "Measure a BME280 temperature signal and use an LED to compare single-threshold control with hysteresis.",
      materials: ["Original Raspberry Pi Pico", "Adafruit BME280 breakout", "LED and appropriate resistor", "Breadboard and verified jumpers", "Data-capable Micro-USB cable", "Room-temperature reference for comparison"],
      steps: [
        "Verify the exact breakout, headers, voltage, interface, address, and Pico pin wiring from current documentation before power.",
        "Log stable room readings first and choose a nearby demonstration setpoint; record sensor resolution and observed variation.",
        "Predict LED behavior with a single threshold, implement it, and gently warm the nearby air with a hand held at a distance—without touching or heating the board directly.",
        "Add separate on/off thresholds, repeat the same observation, and compare the number of transitions and threshold crossings.",
        "Disconnect or mis-address the sensor in a powered-off setup, then verify that the program reports a sensor fault rather than requesting heat."],
      predict: "Predict where the LED will turn on and off for both single-threshold and hysteresis logic, including the expected effect of noisy readings.",
      observe: ["Measured temperature over time", "LED transition temperatures", "Transition count near setpoint", "Sensor-fault behavior"],
      diagnose: ["No sensor data: remove power and check board identity, address, interface, wiring, and pull-ups/documented library setup.", "Chattering LED: inspect threshold order, measurement noise, update interval, and retained prior state.", "Large offset: examine placement, self-heating, airflow, and reference uncertainty before applying a calibration correction."],
      limits: ["The LED is only a request indicator; it must not be connected to building HVAC wiring or power equipment.", "Do not control combustion, mains, compressor, heat-pump, or life-safety equipment with this exercise.", "The bench result does not electrically qualify components or validate a thermostat product."],
    },
    proposedBuild: "Proposed, unvalidated bench exercise: an original Pico reads an Adafruit BME280 and drives a low-voltage LED request indicator using explicit hysteresis and fault handling. It is not an HVAC controller, household-equivalent thermostat, safety device, or completed BOM.",
    supplierIds: ["originalPico", "BME2802652"],
    sources: [source("Texas Instruments — Thermostat solutions", "https://www.ti.com/solution/thermostat")],
  },
  {
    id: "barrier",
    title: "Automatic door or barrier",
    question: "How does a controller turn presence and position signals into motion while making obstruction the dominant condition?",
    summary: "An automatic barrier combines an actuator and linkage with state logic. A request may start opening, position feedback marks travel limits, dwell timing holds the opening, and a close command is permitted only while presence/obstruction conditions remain clear. Energy and information travel on different paths: actuator power creates torque, while low-energy signals decide when it is allowed. The paper analogue explores that priority logic only; it is lightweight, slow, and explicitly not safety-rated.",
    subsystems: [
      { name: "Presence, request, and obstruction inputs", purpose: "Report that opening is requested or that closing must stop/reverse.", energyOrSignal: "Button/sensor state → controller input with defined active and fault meanings.", whatToObserve: "From outside a real installation, note approach, open, dwell, and close timing without blocking, touching, or deliberately defeating sensors." },
      { name: "State controller", purpose: "Prioritize obstruction, sequence closed/opening/open/closing states, and handle timeouts.", energyOrSignal: "Input state + timer + position → bounded motion command or safe stop.", whatToObserve: "Build a timing diagram from normal public operation and documentation; unknown behavior stays unknown." },
      { name: "Motor/servo and power path", purpose: "Convert controlled electrical power into bounded rotation.", energyOrSignal: "Electrical power + position command → shaft torque, motion, heat, and sound.", whatToObserve: "On the analogue, listen for stall/buzz and disconnect immediately; never force a real powered barrier." },
      { name: "Linkage, barrier, and position limits", purpose: "Transform shaft rotation into useful barrier motion and report endpoints.", energyOrSignal: "Shaft torque → linkage force → barrier angle/translation; endpoint signal returns to controller.", whatToObserve: "Measure the paper linkage geometry and commanded endpoints with power off before a slow powered test." },
    ],
    energyFlow: ["Low-voltage bench supply", "Servo electronics and motor", "Output shaft torque", "Paper linkage", "Lightweight barrier motion plus heat/sound"],
    informationFlow: ["Request/presence/obstruction input", "Priority state machine", "Bounded servo position command", "Paper barrier motion", "Simulated endpoint/clear state feedback"],
    prerequisites: ["programming-state", "timers-pwm", "mechanisms-kinematics", "robot-architecture", "reliability-faults"],
    experiment: {
      goal: "Test state priorities and bounded motion on a slow, lightweight paper barrier.",
      materials: ["Original Raspberry Pi Pico", "SG92R micro servo", "Paper or very light card barrier and base", "Flexible paper linkage", "Momentary buttons for request and obstruction", "Validated separate low-voltage servo power arrangement", "Physical power disconnect"],
      steps: [
        "With power disconnected, make a weak paper linkage and set mechanical endpoints that cannot trap a finger or load the servo near stall.",
        "Draw closed, opening, open, closing, and stopped/fault states; make obstruction override closing before writing commands.",
        "Verify connector order, shared reference as documented, servo supply capacity, signal limits, and accessible disconnect.",
        "Test initially with the servo horn disconnected, then attach the paper linkage and command only slow bounded movement while the area stays clear.",
        "Press the simulated obstruction button during closing and confirm the observed state and command match the prediction; disconnect on buzz, binding, or unexpected motion."],
      predict: "For each state, predict the result of request, timeout, endpoint, and obstruction inputs; obstruction during closing must never be ignored.",
      observe: ["State and commanded angle", "Paper barrier endpoint", "Response latency to the simulated obstruction", "Binding, overshoot, buzz, or reset"],
      diagnose: ["Reset during motion: disconnect power and review servo current path, wiring, and supply capacity.", "Wrong direction: remove the horn with power off, correct state/angle mapping, and re-establish safe endpoints.", "Obstruction ignored: stop testing until input polarity, priority ordering, and transition coverage are corrected."],
      limits: ["Use only a weak paper/lightweight barrier with no pinch or impact hazard; this is not safety-rated.", "Do not connect to, modify, or test on a real door, gate, garage opener, access system, or fire/smoke barrier.", "The exercise does not validate entrapment protection, redundant sensing, structural loads, compliance, or a deployable product."],
    },
    proposedBuild: "Proposed, unvalidated bench exercise: a slow SG92R moves a weak paper barrier while buttons simulate request and obstruction inputs. It is a state-priority demonstrator—not a door, gate, safety-rated barrier, household-equivalent product, or completed BOM.",
    supplierIds: ["originalPico", "SG92R169"],
    sources: [
      source("MIT OpenCourseWare — 2.007 Design and Manufacturing I", "https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/pages/syllabus/"),
      source("Adafruit — SG92R micro servo", "https://www.adafruit.com/product/169"),
    ],
  },
];
