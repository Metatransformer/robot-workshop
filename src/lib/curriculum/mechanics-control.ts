import type { LearningModule, LearningSource } from "./types";

const MIT_DESIGN: LearningSource = {
  title: "MIT OpenCourseWare: Design and Manufacturing I",
  url: "https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/pages/syllabus/",
};

const MODERN_ROBOTICS: LearningSource = {
  title: "Modern Robotics",
  url: "https://modernrobotics.northwestern.edu/",
};

const MIT_CIRCUITS: LearningSource = {
  title: "MIT OpenCourseWare: Circuits and Electronics",
  url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
};

const CTMS: LearningSource = {
  title: "Control Tutorials for MATLAB and Simulink",
  url: "https://ctms.engin.umich.edu/CTMS/",
};

const BLINK_WITHOUT_DELAY: LearningSource = {
  title: "Arduino: Blink Without Delay",
  url: "https://docs.arduino.cc/built-in-examples/digital/BlinkWithoutDelay/",
};

export const mechanicsControlModules: LearningModule[] = [
  {
    id: "forces-free-body",
    track: "mechanics",
    title: "Forces and free-body diagrams",
    summary: "Turn a physical assembly into a force balance before choosing a bracket, axle, or actuator.",
    minutes: 45,
    level: "Foundation",
    prerequisites: ["algebra-trig", "vectors-frames"],
    relatedStudy: ["units-estimation"],
    outcomes: [
      "Draw a free-body diagram for one isolated part and solve a two-dimensional static force balance.",
      "Use the result to place supports and estimate an actuator or structural load.",
    ],
    concepts: `A shelf, camera arm, or toy-car axle can look motionless while several forces act on it. The useful first move is to choose one object, mentally remove everything touching it, and replace every contact with a force or moment. That sketch is a free-body diagram. Gravity acts through the center of mass; a cable pulls along itself; a smooth support pushes normal to its surface; a pin can usually react in two directions. Do not draw forces that the isolated object exerts on something else.

Static equilibrium means acceleration is zero, not that forces are absent. In a Cartesian frame, the formal conditions are ΣF_x = 0, ΣF_y = 0, and ΣM_O = 0 about any chosen point O. Weight is W = mg, in newtons, and a force's moment magnitude is M = Fd_perpendicular, in newton-metres. Choosing the moment point at an unknown support often removes that unknown from the moment equation. For accelerating objects, replace zero with ma: ΣF = ma.

Suppose a small screen is mounted on a horizontal arm. Its weight and the arm's weight both create moments at the wall; the bracket reactions close the force balance. This calculation drives a real build decision: moving the screen inward can reduce bracket moment more effectively than merely using a thicker decorative cover.

A common failure is to balance force magnitudes while ignoring direction or lever arm. Equal upward and downward forces can still form a nonzero couple, and a force passing through the pivot creates no moment about that pivot. Another mistake is to add a mysterious “centripetal force”; that phrase names the net inward force required for curved motion, not an extra interaction. Always label the body, frame, application point, and units before writing equations.`,
    workedExample: {
      problem: "A 1.2 kg camera sits 0.30 m from a wall pivot on a massless horizontal arm. A vertical cable attaches 0.40 m from the pivot. Find the cable tension and pivot's vertical reaction using g = 9.81 m/s².",
      steps: [
        "Convert mass to weight: W = 1.2 kg × 9.81 m/s² = 11.77 N downward.",
        "Take moments about the pivot: T(0.40 m) - 11.77 N(0.30 m) = 0, so T = 8.83 N upward.",
        "Balance vertical forces: R_y + 8.83 N - 11.77 N = 0, so R_y = 2.94 N upward.",
      ],
      result: "The cable carries 8.83 N and the pivot supplies 2.94 N upward.",
      sanityCheck: "The cable attaches farther from the pivot than the load, so its force should be smaller than the 11.77 N weight; 8.83 N is consistent.",
    },
    exercise: {
      question: "A downward force on a lever is moved from 50 mm to 100 mm from its pivot without changing magnitude. What happens to its moment about the pivot?",
      choices: ["It halves", "It stays unchanged", "It doubles", "It quadruples"],
      answerIndex: 2,
      explanation: "Moment is force times perpendicular distance, so doubling the distance doubles the moment. Choosing unchanged confuses force balance with moment balance; quadrupling incorrectly squares distance; halving reverses the lever-arm relationship.",
    },
    lab: {
      goal: "Map support reactions on a tabletop beam and diagnose an omitted load.",
      equipment: ["30–50 cm ruler", "Two kitchen scales or spring scales", "Known small masses", "Tape measure"],
      steps: [
        "Rest the ruler on two scales, zero if possible, and record support spacing and the ruler's own baseline readings.",
        "Place a known mass at three measured positions and predict both support forces from force and moment balance before reading the scales.",
        "Record actual readings separately from predicted values and compare their sum with total weight.",
        "Deliberate fault: hide a small taped mass under one end; use the changed total and moment distribution to infer which side contains the unmodelled load.",
      ],
      observe: [
        "Expected: moving the mass toward one support raises that support's share and lowers the other's.",
        "Measure: actual support readings, positions, and residuals; friction, scale zero error, and ruler weight may prevent exact agreement.",
      ],
      transfer: "Draw a free-body diagram for a desk-robot sensor mast and decide where a brace would most reduce base moment.",
      cautions: ["Keep the beam and masses low over the table so a slip cannot damage feet or equipment."],
    },
    projectIds: ["desk-robot", "linkage"],
    glossary: ["force", "free-body-diagram", "moment", "equilibrium", "center-of-mass"],
    sources: [MIT_DESIGN, MODERN_ROBOTICS],
  },
  {
    id: "torque-gearing",
    track: "mechanics",
    title: "Torque, speed, and gearing",
    summary: "Select a gear ratio from load torque and speed instead of treating a gearbox as a free strength multiplier.",
    minutes: 55,
    level: "Practice",
    prerequisites: ["forces-free-body", "rates-integration"],
    outcomes: [
      "Convert a tangential load into shaft torque and reflect speed and torque through an ideal gear ratio.",
      "Choose a preliminary ratio while reserving margin for loss, acceleration, and motor limits.",
    ],
    concepts: `Twisting effort is torque. A screwdriver, bicycle crank, toy-car wheel, and vacuum blower shaft all trade force at a radius for rotation. For a force perpendicular to a lever, τ = rF. More generally, τ = |r × F| = rF sin θ. Torque uses newton-metres; angular speed uses radians per second. Mechanical power connects them: P = τω.

For two meshing ideal gears, tooth pitch makes tangential speeds equal. Define reduction ratio G = ω_in/ω_out. Then ω_out = ω_in/G and τ_out = Gτ_in. Real gearboxes lose power, so τ_out ≈ ηGτ_in, where efficiency η is below one. The motor also needs torque to accelerate inertia: τ = Iα. A 10:1 reducer may offer roughly ten times stall torque at one-tenth no-load speed, but it does not create energy.

Start ratio selection from the output. Convert the required push or lift to torque, add allowance for friction and acceleration, then compare the reflected demand with the motor's usable operating region—not merely stall torque. For a toy car, wheel radius converts tractive force into axle torque, while desired vehicle speed converts to wheel rpm. Those two constraints bound the gear ratio. This is the build decision: choose a ratio that satisfies both with margin, or change wheel size or motor rather than forcing an impossible compromise.

Common failure modes are mixing rpm with rad/s, using diameter where radius belongs, and designing at stall. At stall, speed and mechanical output power are zero and heating is severe. Backlash also means direction changes can move the motor briefly without moving the load. The optional DC-motor simulation is a bounded linear torque-speed and gearbox model; it omits temperature, nonlinear friction, tooth compliance, and controller current limits.`,
    workedExample: {
      problem: "A 65 mm diameter toy-car wheel must deliver 6.0 N of tractive force at 0.50 m/s. A motor runs at 3000 rpm at the chosen load point. Estimate ideal ratio, wheel torque, and motor torque with 80% gearbox efficiency.",
      steps: [
        "Wheel radius is 0.0325 m, so required wheel torque is 6.0 N × 0.0325 m = 0.195 N·m.",
        "Wheel angular speed is v/r = 0.50 m/s ÷ 0.0325 m = 15.38 rad/s = 147 rpm.",
        "Required reduction is G = 3000 rpm ÷ 147 rpm = 20.4:1.",
        "From τ_out = ηGτ_in, motor torque is 0.195 N·m ÷ (0.80 × 20.4) = 0.0119 N·m.",
      ],
      result: "A preliminary 20:1 reducer needs about 11.9 mN·m motor torque at the selected operating point.",
      sanityCheck: "Input mechanical power is about 0.0119 N·m × 314 rad/s = 3.74 W; 80% gives 2.99 W, matching output power 6.0 N × 0.50 m/s = 3.0 W.",
    },
    exercise: {
      question: "An ideal 4:1 reduction is added between a motor and wheel. Ignoring inertia, what changes at the wheel?",
      choices: ["Torque ×4 and speed ÷4", "Torque ÷4 and speed ×4", "Torque ×4 and speed unchanged", "Power ×4"],
      answerIndex: 0,
      explanation: "An ideal reduction exchanges speed for torque: output torque rises fourfold and speed falls fourfold, leaving power unchanged. The reverse choice describes a speed increaser. Keeping speed or multiplying power violates the ideal power balance.",
    },
    lab: {
      goal: "Measure the force-speed tradeoff of two pulley ratios and locate backlash or slip.",
      equipment: ["Low-voltage geared motor or hand crank", "Two pulley sizes", "String", "Small masses", "Ruler", "Phone stopwatch"],
      steps: [
        "With power disconnected, assemble a large-to-small and small-to-large pulley arrangement; measure effective radii.",
        "For each arrangement, predict line travel per input revolution and the ideal hanging force ratio.",
        "Use a hand crank, or a current-limited low-voltage motor within its rating, to lift a small mass through 0.30 m and time the lift.",
        "Deliberate fault: loosen one pulley set screw slightly; diagnose slip from shaft motion without proportional line travel, then retighten unpowered.",
      ],
      observe: [
        "Expected: the higher reduction lifts more slowly with greater available line force.",
        "Measure: actual lift time, supported mass, input turns, and lost motion; do not report the ideal ratio as measured efficiency.",
      ],
      transfer: "Choose a wheel diameter and preliminary ratio for a desk robot that must climb a 10 mm cable ramp without exceeding a stated speed.",
      cautions: ["Use only small masses and low voltage; disconnect power before touching pulleys or set screws."],
    },
    projectIds: ["desk-robot", "linkage"],
    glossary: ["torque", "gear-ratio", "angular-speed", "mechanical-power", "backlash", "efficiency"],
    sources: [MIT_DESIGN, MODERN_ROBOTICS],
    simulation: "dc-motor",
  },
  {
    id: "materials-stress",
    track: "mechanics",
    title: "Materials, stress, and stiffness",
    summary: "Size a simple member by separating strength from stiffness and documenting a defensible safety margin.",
    minutes: 55,
    level: "Practice",
    prerequisites: ["forces-free-body"],
    relatedStudy: ["units-estimation"],
    outcomes: [
      "Calculate axial stress, strain, and elastic extension for a uniform member.",
      "Explain why material, geometry, load case, and safety factor all affect a part choice.",
    ],
    concepts: `A part can fail by breaking, yielding permanently, bending too far, buckling, wearing, or cracking after repeated loads. “Strong” therefore is incomplete. A plastic camera bracket may safely carry its load yet flex enough to blur an image; a thin printer guide may be stiff in one direction and flexible in another because its shape, not just its material, matters.

For a straight member under axial load F, normal stress is σ = F/A in pascals, and strain is ε = ΔL/L, a dimensionless ratio. In the linear elastic range, σ = Eε, where Young's modulus E measures stiffness. Combining them gives ΔL = FL/(AE). Yield strength marks the onset of substantial permanent deformation for a simple tensile test; an allowable stress might be σ_allow = σ_y/SF using safety factor SF. Bending stress and deflection depend strongly on cross-section shape; moving material away from the neutral axis increases second moment of area and can greatly improve bending stiffness without proportional mass.

The build decision is not “metal versus plastic” in the abstract. Identify the load path, environment, manufacturing direction, allowable motion, and credible peak load. A printed polymer part is anisotropic: layer adhesion, holes, notches, heat, and creep can dominate a handbook tensile number. Cardboard corrugation likewise gives direction-dependent stiffness.

A common misconception is that doubling thickness merely doubles stiffness. In many bending geometries, thickness enters the section property with a third power, although the exact relationship depends on cross-section and boundary conditions. Another failure is applying a safety factor to an uncertain internet strength value while ignoring stress concentration at a sharp corner. Treat simple equations as screening models, inspect where load actually enters, and test representative coupons when consequences matter.`,
    workedExample: {
      problem: "A 200 mm long aluminum tie, cross-section 3.0 mm × 10 mm, carries 900 N axial tension. With E = 69 GPa and assumed yield strength 240 MPa, find stress, extension, and yield safety factor.",
      steps: [
        "Area A = 30 mm² = 30 × 10⁻⁶ m².",
        "Stress σ = 900 N ÷ (30 × 10⁻⁶ m²) = 30 MPa.",
        "Strain ε = σ/E = 30 MPa ÷ 69,000 MPa = 0.000435.",
        "Extension ΔL = εL = 0.000435 × 0.200 m = 0.000087 m = 0.087 mm; safety factor = 240/30 = 8.0.",
      ],
      result: "The simple axial model predicts 30 MPa stress, 0.087 mm extension, and safety factor 8 against the assumed yield value.",
      sanityCheck: "The strain is well below 0.1%, so a sub-millimetre extension over 200 mm is plausible; the result does not cover holes, bending, fatigue, or buckling.",
    },
    exercise: {
      question: "Two rods of equal material and length carry the same axial tension. Rod B has twice Rod A's cross-sectional area. In the elastic range, what are B's stress and extension?",
      choices: ["Both double", "Both halve", "Stress halves but extension stays equal", "Stress stays equal but extension halves"],
      answerIndex: 1,
      explanation: "Both σ = F/A and ΔL = FL/(AE) are inversely proportional to area, so both halve. Holding either quantity constant overlooks that the same geometry term appears in both relations; doubling is the direction error.",
    },
    lab: {
      goal: "Compare material stiffness without confusing predicted deflection with measured deflection.",
      equipment: ["Equal-length strips of cardboard, wood, or printed plastic", "Small masses", "Ruler", "Two supports", "Clamps or tape"],
      steps: [
        "Support each strip over the same span and mark its unloaded midpoint height.",
        "Predict which orientation and material will deflect least under the same small mass, stating why.",
        "Add masses incrementally, record actual midpoint deflection, and remove them to check whether the strip returns.",
        "Deliberate fault: introduce a small notch in a sacrificial strip away from hands; identify localized bending or early damage rather than attributing it to bulk material alone.",
      ],
      observe: [
        "Expected: edgewise or rib-aligned specimens are usually stiffer than flat or cross-grain specimens.",
        "Measure: load, span, orientation, deflection, and residual set; actual values depend on imperfect supports and material variation.",
      ],
      transfer: "Redesign a sensor shelf by changing its cross-section before simply changing to a heavier material.",
      cautions: ["Wear eye protection around brittle samples and stop before sudden fracture; keep loads small."],
    },
    projectIds: ["linkage", "desk-robot", "blank"],
    glossary: ["stress", "strain", "youngs-modulus", "yield-strength", "safety-factor"],
    sources: [MIT_DESIGN],
  },
  {
    id: "fasteners-bearings",
    track: "mechanics",
    title: "Fasteners, joints, and bearings",
    summary: "Design a joint that clamps reliably and a rotating support that carries the intended load without binding.",
    minutes: 50,
    level: "Practice",
    prerequisites: ["forces-free-body", "torque-gearing"],
    relatedStudy: ["materials-stress"],
    outcomes: [
      "Explain bolt preload, joint friction, and why tightening torque is only an indirect control variable.",
      "Choose and align a simple bushing or bearing for radial and axial load paths.",
    ],
    concepts: `A screw does more than pin two parts together. Tightening stretches the screw slightly and compresses the joint, creating preload. External sideways load can then be resisted by friction between clamped faces instead of repeatedly shearing the screw. A loose printer frame rattles because contact opens and slips; simply installing a larger screw may not fix poor seating, weak material, or absent locking.

An approximate relationship is T ≈ KFd, where tightening torque T produces preload F in a screw of nominal diameter d and K lumps thread and under-head friction. K varies substantially with finish and lubrication, so torque is an imprecise proxy for preload. A washer spreads contact pressure; a locknut, thread-forming feature, or suitable threadlocker can resist loosening, but none repairs stripped threads. In soft printed plastic, a through-bolt with washer or a correctly installed insert may be more repeatable than repeatedly threading into the polymer.

Bearings constrain motion while carrying loads. Radial load acts across a shaft; axial or thrust load acts along it. Plain bushings tolerate dirt and can be simple, while rolling bearings reduce friction but need appropriate fits and alignment. Two bearings forced into misaligned holes can bind because each imposes a slightly different shaft axis. The build decision is therefore joint and load-path specific: place supports apart enough to resist moment, provide a shoulder or separate thrust surface when axial force exists, and avoid over-constraining an imperfect frame.

A common misconception is that tighter is always safer. Excess torque can yield a small screw, crush a screen bezel, pull an insert from plastic, or overload a bearing. Conversely, finger-tight hardware can lose preload under vibration. Another mistake is pressing force through rolling elements during installation; load should be applied to the ring being fitted. For novice builds, use published hardware guidance when available and validate low-consequence joints experimentally.`,
    workedExample: {
      problem: "Estimate the preload from 1.2 N·m tightening torque on an M4 screw using K = 0.20, then estimate friction capacity at the single interface between two mating clamped faces with μ = 0.25.",
      steps: [
        "Use d = 4.0 mm = 0.0040 m and F = T/(Kd).",
        "F = 1.2 N·m ÷ (0.20 × 0.0040 m) = 1500 N estimated preload.",
        "With one effective slip plane, friction capacity is μF = 0.25 × 1500 N = 375 N.",
      ],
      result: "The rough model predicts 1.5 kN preload and 375 N slip resistance.",
      sanityCheck: "The large sensitivity to K matters: if K were 0.30, estimated preload would fall to 1000 N. This is not a recommended torque or proof the materials can withstand it.",
    },
    exercise: {
      question: "A shaft spins freely in either bearing alone but binds when both bearings are bolted rigidly to a frame. What is the best first diagnosis?",
      choices: ["The motor needs more voltage", "The bearing bores are misaligned", "The shaft needs a higher gear ratio", "The bolts are too strong"],
      answerIndex: 1,
      explanation: "Free motion in each bearing individually but binding together is strong evidence that their axes disagree. More voltage masks the mechanical fault and may overheat the motor. Gear ratio and bolt strength do not explain the assembly-dependent binding.",
    },
    lab: {
      goal: "Observe preload loss and bearing alignment in a low-load linkage pivot.",
      equipment: ["Cardboard or printed linkage strips", "M4 bolt, washers, and locknut", "Drinking-straw bushing", "Small spring scale"],
      steps: [
        "Build a pivot first with the bolt clamping directly on the moving strips; note the tightening range between wobble and binding.",
        "Add a straw bushing cut slightly longer than the moving stack so the bolt clamps the bushing while the link rotates around it.",
        "Predict and then measure approximate pull force needed to start motion in both versions.",
        "Deliberate fault: skew one support washer or bracket; diagnose alignment by rotating slowly and observing whether resistance varies with angle.",
      ],
      observe: [
        "Expected: a correctly sized bushing separates clamp preload from pivot clearance and widens the usable tightening range.",
        "Measure: actual start force and side play; record variation rather than claiming a universal friction coefficient.",
      ],
      transfer: "Specify the fastener, washer, bushing, and axial restraint for one desk-robot wheel or linkage joint.",
      cautions: ["Deburr cut tubing and keep the low-load test away from pinch points."],
    },
    projectIds: ["linkage", "desk-robot"],
    glossary: ["preload", "clamping-force", "radial-load", "axial-load", "bearing", "bushing"],
    sources: [MIT_DESIGN],
  },
  {
    id: "tolerances-fits",
    track: "mechanics",
    title: "Tolerances, fits, and variation",
    summary: "Allocate clearance from measured variation so parts assemble deliberately rather than by luck.",
    minutes: 45,
    level: "Practice",
    prerequisites: ["measurement-instruments"],
    relatedStudy: ["probability-uncertainty", "fasteners-bearings"],
    outcomes: [
      "Compute worst-case clearance from mating-part limits and distinguish clearance, transition, and interference fits.",
      "Design a calibration coupon and revise nominal dimensions from measurements.",
    ],
    concepts: `Two parts drawn with the same diameter are not guaranteed to fit. Every process varies: a drilled hole wanders, a printer shrinks corners, a laser kerf removes width, and caliper readings have uncertainty. A tolerance states the permitted variation around a nominal dimension. A fit describes the relationship of two mating sizes: clearance always leaves space, interference always overlaps, and transition may do either.

For a shaft between S_min and S_max and a hole between H_min and H_max, clearance C = H - S. Worst-case minimum clearance is C_min = H_min - S_max; maximum clearance is C_max = H_max - S_min. If C_min is positive, the stated limits guarantee clearance. If C_max is negative, they guarantee interference. This arithmetic is simple but powerful because it exposes whether an assembly claim survives variation.

Tolerance allocation should follow function. A rotating toy-car axle needs enough running clearance not to bind after slight frame misalignment, while a camera insert may need firm location. Excess clearance creates wobble, noise, and position error. Tight tolerances also cost time and may be impossible for the chosen process. A practical build decision is to print or cut a small coupon containing several candidate hole sizes, measure the actual results, and select a compensated nominal dimension for that machine, material, and orientation.

A common misconception is that CAD precision equals manufacturing accuracy. Displaying 6.000 mm does not make a 6.000 mm hole. Another is adding every statistical uncertainty as though all extremes always coincide, or doing the opposite and ignoring worst case when assembly must be guaranteed. Use worst-case limits for guaranteed fit, and statistical reasoning only when its assumptions and acceptable failure rate are explicit. Do not “fix” a binding assembly by forcing it until the real interference, burr, or misalignment is understood.`,
    workedExample: {
      problem: "A shaft is specified 5.96–5.99 mm and a printed hole 6.05–6.12 mm. Find the clearance range and classify the fit under these limits.",
      steps: [
        "Minimum clearance uses smallest hole and largest shaft: 6.05 mm - 5.99 mm = 0.06 mm.",
        "Maximum clearance uses largest hole and smallest shaft: 6.12 mm - 5.96 mm = 0.16 mm.",
        "Because even minimum clearance is positive, the limits specify a clearance fit.",
      ],
      result: "Diametral clearance is guaranteed between 0.06 mm and 0.16 mm.",
      sanityCheck: "The midpoints differ by about 0.11 mm, exactly the midpoint of the clearance range.",
    },
    exercise: {
      question: "A hole ranges from 9.98 to 10.04 mm and a pin from 10.00 to 10.02 mm. Which fit is guaranteed?",
      choices: ["Clearance", "Interference", "Transition", "Line-to-line only"],
      answerIndex: 2,
      explanation: "Minimum clearance is 9.98 - 10.02 = -0.04 mm, while maximum is 10.04 - 10.00 = +0.04 mm. The fit may interfere or clear, so it is transition. Looking only at nominal 10 mm hides the limiting cases.",
    },
    lab: {
      goal: "Calibrate a fabrication process with a fit coupon and diagnose geometry-dependent error.",
      equipment: ["Printed or laser-cut hole/slot coupon", "Known pins or drill shanks", "Calipers", "Marker"],
      steps: [
        "Label candidate holes or slots in 0.1 mm nominal increments and predict the smallest free-running size.",
        "Measure each feature in at least two directions and record actual values separately from CAD labels.",
        "Test the same pin gently in each feature; classify loose, running, snug, or interference without forcing.",
        "Deliberate fault: compare a round feature with one intentionally oval or printed in a different orientation; diagnose whether average size alone explains binding.",
      ],
      observe: [
        "Expected: actual dimensions show systematic offset plus feature-to-feature variation.",
        "Measure: directional sizes, fit class, material, process, and orientation; the coupon does not establish universal compensation.",
      ],
      transfer: "Set a compensated hole size and tolerance note for a removable sensor mount, including how it will be verified.",
      cautions: ["Do not use sharp rotating tools as gauges; use unpowered smooth shanks or purpose-made pins."],
    },
    projectIds: ["linkage", "sensor", "desk-robot"],
    glossary: ["nominal-dimension", "tolerance", "clearance-fit", "interference-fit", "uncertainty"],
    sources: [MIT_DESIGN],
  },
  {
    id: "cad-fabrication",
    track: "mechanics",
    title: "CAD for fabrication",
    summary: "Model intent, process limits, and inspection features so a digital part can become a usable physical part.",
    minutes: 60,
    level: "Practice",
    prerequisites: ["engineering-workflow", "tolerances-fits"],
    relatedStudy: ["materials-stress"],
    outcomes: [
      "Build a parameterized part around functional datums and process-aware dimensions.",
      "Prepare a fabrication and inspection plan that preserves critical interfaces.",
    ],
    concepts: `CAD is a compact statement of design intent, not merely a picture. A useful model says which dimensions control function and which geometry should update together. If a screen frame changes width, centered mounting holes should remain centered because they reference a midplane or explicit parameter, not a chain of arbitrary offsets. Stable intent makes revisions predictable.

Begin with datums: surfaces, axes, or planes from which important dimensions are measured. Constrain sketches until their remaining freedom is intentional. Name parameters such as shaft_diameter, wall, and hole_spacing, then derive repeated geometry from them. Avoid long tolerance chains. If feature C must align with feature A, dimension C from A rather than through unrelated feature B. For fabrication, minimum wall, tool diameter, kerf, layer direction, support access, bend radius, and fastener installation space are as real as the nominal shape.

The selected process changes the design. A milled internal corner inherits cutter radius; a laser-cut slot receives kerf and has nearly vertical walls; a fused-filament print may bridge short gaps but produces anisotropic layers and often undersized horizontal holes. Add sacrificial tabs, fillets, chamfers, or inspection faces only when they serve a named need. The build decision is to preserve a camera's optical-axis location while allowing noncritical enclosure edges wider tolerance, rather than applying expensive precision everywhere.

A common failure is exporting a visually correct mesh with wrong units or inadequate tessellation. Another is “fixing” a manufactured part by editing several unrelated dimensions instead of updating the governing parameter. Before fabrication, inspect overall size, wall thickness, clearances, orientation, and units. After fabrication, compare actual critical dimensions with their acceptance limits. A beautiful render cannot show hidden tool access, support scars, weak layer orientation, or whether a connector can be inserted.`,
    workedExample: {
      problem: "A laser-cut linkage needs 100.0 ± 0.2 mm center distance. Two holes are each located from opposite outer edges of a 130.0 ± 0.4 mm plate by 15.0 ± 0.2 mm. Find worst-case center-distance tolerance and improve the dimension scheme.",
      steps: [
        "The chained center distance is plate width minus both edge offsets: 130.0 - 15.0 - 15.0 = 100.0 mm.",
        "Worst-case variation adds absolute limits: ±(0.4 + 0.2 + 0.2) = ±0.8 mm.",
        "Dimension one hole as datum and the second directly at 100.0 ± 0.2 mm; let noncritical edge margins absorb plate-width variation.",
      ],
      result: "The original chain permits 99.2–100.8 mm, while direct functional dimensioning controls the required 99.8–100.2 mm spacing.",
      sanityCheck: "Nominal geometry is unchanged; only the tolerance path changes, which is exactly the point of design intent.",
    },
    exercise: {
      question: "A milled rectangular pocket must accept a perfectly sharp-cornered insert. What issue should be addressed in the CAD design?",
      choices: ["The cutter leaves internal corner radii", "The pocket automatically shrinks equally everywhere", "CAD removes all process limits", "More decimal places create sharp corners"],
      answerIndex: 0,
      explanation: "A rotating cutter cannot create an internal radius smaller than its own radius, so the insert or pocket needs relief, rounded corners, or another process. Uniform shrinkage and displayed precision do not solve tool geometry, and CAD does not override it.",
    },
    lab: {
      goal: "Create and inspect a process-aware mounting plate revision.",
      equipment: ["Any parametric CAD tool", "Printer or paper template", "Calipers or ruler", "Sample fastener and connector"],
      steps: [
        "Define named parameters for plate width, hole spacing, fastener clearance, and connector keep-out.",
        "Sketch from a central datum, fully constrain functional features, and predict which dimensions change when width is increased 10 mm.",
        "Print a 1:1 paper template or fabricate a low-cost coupon; verify scale and test physical access with unpowered components.",
        "Deliberate fault: export once with an intentionally wrong unit assumption; diagnose it using one known overall dimension before fabrication.",
      ],
      observe: [
        "Expected: parameter changes preserve hole alignment and keep-out relationships while noncritical edges move.",
        "Measure: actual template scale and accessible clearances; a paper check validates layout, not strength or final process accuracy.",
      ],
      transfer: "Revise a sensor bracket for a second board width using parameters, and identify which interface dimensions must not move.",
      cautions: ["Keep electronics unpowered during physical fit checks and do not fabricate until export units are verified."],
    },
    projectIds: ["linkage", "sensor", "desk-robot", "blank"],
    glossary: ["datum", "constraint", "parameter", "tolerance-stack", "kerf", "design-intent"],
    sources: [MIT_DESIGN],
  },
  {
    id: "mechanisms-kinematics",
    track: "mechanics",
    title: "Mechanisms and planar kinematics",
    summary: "Relate link geometry to constrained motion before selecting an actuator or claiming a reachable workspace.",
    minutes: 65,
    level: "Advanced",
    prerequisites: ["algebra-trig", "vectors-frames"],
    relatedStudy: ["torque-gearing", "cad-fabrication"],
    outcomes: [
      "Compute the endpoint position of a two-link planar chain from joint angles.",
      "Recognize mobility limits, singular alignments, and mechanical interference in a linkage.",
    ],
    concepts: `A mechanism turns allowed motion at joints into useful motion elsewhere. Door hinges, printer carriages, windshield-wiper linkages, and camera gimbals constrain parts so the user does not have to guide every coordinate. Kinematics describes position, velocity, and acceleration without yet asking what forces produce them.

For a planar two-revolute-link chain with lengths L₁ and L₂ and joint angles θ₁ and θ₂, measured with θ₂ relative to link one, the endpoint is x = L₁ cos θ₁ + L₂ cos(θ₁ + θ₂) and y = L₁ sin θ₁ + L₂ sin(θ₁ + θ₂). Differentiating relates joint rates to endpoint velocity through a Jacobian: v = J(q)q̇. When the links align, the Jacobian loses rank in one direction. Near that singular configuration, a modest requested endpoint motion can demand very large joint rates or produce little leverage in a direction.

Mobility depends on links and joint constraints, but a count alone does not reveal collisions, joint limits, backlash, or assembly mode. A four-bar may have the nominal mobility to move yet lock because link lengths violate reach conditions or because a bolt head hits a neighbor. Prototype the motion envelope before choosing an actuator. For a desk linkage, moving the motor attachment inward reduces required travel but increases required force; geometry and torque must be considered together.

A common misconception is that reachable points form a uniformly controllable workspace. A two-link arm can reach radii between |L₁ - L₂| and L₁ + L₂ in the ideal plane, but joint limits and singularities remove useful regions. Another failure is mixing absolute and relative angles in the endpoint equations. Draw coordinate frames on each link, declare the angle convention, and test easy poses such as both angles zero before trusting code or CAD motion.`,
    workedExample: {
      problem: "A planar arm has L₁ = 120 mm, L₂ = 80 mm, θ₁ = 30°, and relative θ₂ = -60°. Find its endpoint.",
      steps: [
        "The second link's absolute angle is θ₁ + θ₂ = -30°.",
        "x = 120 cos 30° + 80 cos(-30°) = 103.9 mm + 69.3 mm = 173.2 mm.",
        "y = 120 sin 30° + 80 sin(-30°) = 60.0 mm - 40.0 mm = 20.0 mm.",
      ],
      result: "The endpoint is approximately (173.2 mm, 20.0 mm) in the base frame.",
      sanityCheck: "Its distance from the base is 174.4 mm, within the ideal radial reach of 40–200 mm.",
    },
    exercise: {
      question: "For a two-link planar arm, both links become collinear and fully extended. Why is that pose special?",
      choices: ["The arm gains an extra joint", "Small radial outward motion is impossible and the Jacobian is singular", "Motor torque becomes zero for every load", "The endpoint position becomes undefined"],
      answerIndex: 1,
      explanation: "At full extension the arm cannot move farther radially outward through infinitesimal joint motion, so the velocity mapping loses a direction. The joints and endpoint remain defined, and load torque is not universally zero.",
    },
    lab: {
      goal: "Map the real workspace and singular behavior of a cardboard two-link arm.",
      equipment: ["Cardboard strips", "Two paper fasteners or bolts", "Grid paper", "Protractor", "Pencil"],
      steps: [
        "Build two measured links on a pinned base and define zero angle and positive rotation on the grid.",
        "Predict endpoint coordinates for five joint-angle pairs, then mark actual pencil positions without forcing joints.",
        "Move each joint by roughly 5° near a bent pose and near full extension; compare endpoint motion direction and distance.",
        "Deliberate fault: add a cardboard stop that restricts one joint; diagnose why the measured workspace is smaller than the ideal annulus.",
      ],
      observe: [
        "Expected: calculations and marks broadly agree, with greatest directional sensitivity changing by pose.",
        "Measure: actual link lengths, angles, endpoint coordinates, joint play, and stop locations; do not treat drawing error as theoretical reach.",
      ],
      transfer: "Choose a safe camera pointing region that stays away from a linkage singularity and physical cable collision.",
      cautions: ["Round sharp cardboard corners and keep fingers out of closing linkage angles."],
    },
    projectIds: ["linkage", "desk-robot"],
    glossary: ["kinematics", "degree-of-freedom", "workspace", "jacobian", "singularity", "joint-frame"],
    sources: [MODERN_ROBOTICS, MIT_DESIGN],
  },
  {
    id: "friction-efficiency",
    track: "mechanics",
    title: "Friction, losses, and mechanical efficiency",
    summary: "Locate mechanical losses experimentally and decide whether alignment, contact, or transmission choice deserves attention.",
    minutes: 45,
    level: "Practice",
    prerequisites: ["forces-free-body", "torque-gearing"],
    relatedStudy: ["fasteners-bearings"],
    outcomes: [
      "Use simple static and kinetic friction models within their stated limits.",
      "Calculate transmission efficiency from input and output power and isolate likely loss sources.",
    ],
    concepts: `Friction is useful when a tire pushes a toy car, a belt grips a pulley, or a screw joint resists slip. It is wasteful when a misaligned axle scrubs its bushing. The design question is not “remove friction,” but put traction where force transfer is needed and reduce parasitic resistance elsewhere.

A simple dry-contact model bounds static friction by |F_t| ≤ μ_sN. Sliding friction is often approximated as F_k = μ_kN opposite relative motion. These coefficients summarize a particular pair of surfaces and conditions; they are not fundamental constants. Rolling resistance, bearing seals, lubricant shear, gear tooth loss, air drag, cable flex, and material hysteresis need different models. A vacuum blower, for example, spends shaft power moving air as well as overcoming bearing and aerodynamic losses; blocking flow does not imply a simple universal reduction in motor load.

Efficiency is η = P_out/P_in. For steady rotation, P = τω; for translation, P = Fv. Efficiencies multiply through stages: three stages each at 90% yield 0.9³ ≈ 73%, not 70% or 90%. This informs a concrete build decision: before buying a larger motor, disconnect transmission stages and measure no-load current or hand resistance to find a bent shaft, overtight belt, rubbing wheel, or misaligned bearing.

A common misconception is that static friction always equals μ_sN. That value is a maximum; actual static friction takes the value required to prevent slip up to the limit. Another failure is estimating efficiency from force alone while input and output speeds differ. Heat, sound, vibration, and wear are clues to loss, but they are qualitative until measured. Any efficiency over 100% signals inconsistent boundaries, units, timing, or stored energy—not a miraculous gearbox.`,
    workedExample: {
      problem: "A gearbox receives 0.050 N·m at 200 rad/s and delivers 0.42 N·m at 18 rad/s. Find power, efficiency, and loss.",
      steps: [
        "Input power is 0.050 N·m × 200 rad/s = 10.0 W.",
        "Output power is 0.42 N·m × 18 rad/s = 7.56 W.",
        "Efficiency is 7.56 W ÷ 10.0 W = 0.756 = 75.6%; loss is 10.0 - 7.56 = 2.44 W.",
      ],
      result: "The gearbox is 75.6% efficient at this operating point and dissipates 2.44 W.",
      sanityCheck: "Output power is below input power and the implied speed reduction of 11.1:1 gives less than the ideal 11.1-fold torque gain.",
    },
    exercise: {
      question: "A box rests on a level surface. The maximum static friction is 12 N, and you push horizontally with 5 N without motion. What is the friction force magnitude?",
      choices: ["0 N", "5 N", "12 N", "17 N"],
      answerIndex: 1,
      explanation: "Static friction matches the needed 5 N to maintain rest, provided it stays below its 12 N maximum. Selecting 12 N treats the limit as an always-present force; 0 N would permit acceleration; 17 N incorrectly adds the push and limit.",
    },
    lab: {
      goal: "Separate rolling resistance, alignment loss, and drivetrain drag on a small cart.",
      equipment: ["Toy car or simple cart", "Spring scale", "Tape measure", "Small removable mass", "Stopwatch"],
      steps: [
        "Predict how added normal load will change steady pull force on the same surface.",
        "Pull the unpowered cart slowly at roughly constant speed and record actual force over a marked distance, then repeat with added mass.",
        "Disconnect or lift one drivetrain element if accessible without damage and compare pull force.",
        "Deliberate fault: skew one wheel slightly; identify the fault from increased pull, curved travel, and local rubbing, then restore alignment.",
      ],
      observe: [
        "Expected: a skewed wheel raises resistance and causes drift; added load often raises contact losses.",
        "Measure: actual force range, mass, distance, and configuration; hand-pull variation limits precision.",
      ],
      transfer: "Create a loss budget for a printer-style belt axis and identify the first isolation test if its motor runs hot.",
      cautions: ["Perform tests unpowered and keep hair, cords, and fingers clear of wheels and belts."],
    },
    projectIds: ["desk-robot", "linkage"],
    glossary: ["static-friction", "kinetic-friction", "normal-force", "efficiency", "power-loss"],
    sources: [MIT_DESIGN],
  },
  {
    id: "signals-systems",
    track: "control",
    title: "Signals and dynamic systems",
    summary: "Describe how an input changes over time and predict a first-order system response before adding feedback.",
    minutes: 60,
    level: "Foundation",
    prerequisites: ["algebra-trig", "rates-integration"],
    relatedStudy: ["capacitance-transients", "programming-state"],
    outcomes: [
      "Identify input, state, output, disturbance, and time scale in a dynamic model.",
      "Calculate a first-order step response and relate its time constant to observed behavior.",
    ],
    concepts: `A signal is a quantity considered as it changes: screen brightness command versus time, measured motor speed, room temperature, or camera angle. A system maps input histories to output histories. Some systems respond nearly at once; others store energy or information, so the present output depends on state accumulated from the past.

A compact first-order model is τ dy/dt + y = Ku, where u(t) is input, y(t) output, K steady-state gain, and τ the time constant. For a constant step from zero to U at t = 0, y(t) = KU(1 - e^{-t/τ}). After one τ, the output reaches about 63.2% of its final change; after roughly 4τ it reaches about 98.2%. An RC voltage, a simplified thermal sensor, or a heavily damped speed response may fit this shape over a limited operating range.

State is the minimum remembered information needed to predict future behavior given future input. In a capacitor model, voltage is state; in a moving mechanism, position and velocity may both be needed. Disturbances enter outside the commanded input, while measurement noise corrupts what the controller sees. Deciding which variable is input or disturbance depends on the model boundary. This matters when choosing update rates: a sensor sampled much faster than its physical time constant may produce more data without revealing faster real dynamics.

A common misconception is that gain K alone describes response speed. Gain sets the eventual change per input; τ sets how quickly it approaches. Another is assuming any curved trace proves a first-order law. Dead time, saturation, multiple energy stores, friction, and changing gain can violate it. The optional RC transient simulation is a bounded ideal first-order model; it omits component tolerance, source resistance unless specified, leakage, and measurement loading. Use residuals and repeated tests before treating a fitted time constant as physical truth.`,
    workedExample: {
      problem: "A simplified fan-speed system has K = 120 rpm/V and τ = 0.80 s. A command steps from 0 to 5.0 V. Predict speed at 0.80 s and 2.40 s.",
      steps: [
        "Final model speed is KU = 120 rpm/V × 5.0 V = 600 rpm.",
        "At t = τ: y = 600(1 - e⁻¹) = 379 rpm.",
        "At t = 3τ: y = 600(1 - e⁻³) = 570 rpm.",
      ],
      result: "The model predicts about 379 rpm at 0.80 s and 570 rpm at 2.40 s.",
      sanityCheck: "Both values lie between the initial 0 and final 600 rpm and rise monotonically; 570 rpm is 95% of final at 3τ.",
    },
    exercise: {
      question: "Two first-order systems have the same gain. System A has τ = 0.2 s and B has τ = 1.0 s. For the same step, which statement is correct?",
      choices: ["A reaches its final value sooner", "B has five times the final value", "Both traces are identical", "A must overshoot"],
      answerIndex: 0,
      explanation: "Smaller τ means a faster approach to the same final value because gain is equal. Time constant does not multiply steady-state gain, and a basic first-order step response does not require overshoot.",
    },
    lab: {
      goal: "Estimate a first-order time constant and detect when the model is inadequate.",
      equipment: ["Low-voltage RC circuit or temperature sensor", "Microcontroller or multimeter with timed readings", "Stopwatch", "Known safe step input"],
      steps: [
        "Predict the final output and 63% level from component values or an initial trial.",
        "Apply a low-voltage step and record actual output at evenly spaced times without changing the circuit.",
        "Estimate τ from the first crossing of 63% of the total change and compare predicted and actual traces.",
        "Deliberate fault: add a second RC stage or insulating layer; diagnose model mismatch from a delayed or differently curved response rather than forcing one τ to fit all times.",
      ],
      observe: [
        "Expected: a single-store system approaches a stable value without overshoot and crosses 63% near one τ.",
        "Measure: actual timestamps and outputs; label the theoretical curve separately and note meter/sample timing uncertainty.",
      ],
      transfer: "Choose a reasonable logging interval for a slow environmental sensor and justify it relative to measured dynamics.",
      cautions: ["Use only low-voltage circuits within component and instrument ratings; discharge capacitors before rewiring."],
    },
    projectIds: ["sensor", "desk-robot"],
    glossary: ["signal", "system", "state", "time-constant", "gain", "step-response"],
    sources: [MIT_CIRCUITS, CTMS],
    simulation: "rc-transient",
  },
  {
    id: "feedback-pid",
    track: "control",
    title: "Feedback and PID control",
    summary: "Build a feedback loop and choose proportional, integral, and derivative actions from observed error behavior.",
    minutes: 70,
    level: "Practice",
    prerequisites: ["signals-systems", "programming-state"],
    relatedStudy: ["motor-drivers", "mcu-gpio", "timers-pwm"],
    outcomes: [
      "Trace reference, measurement, error, controller output, plant, and disturbance through a closed loop.",
      "Calculate a discrete PID update and explain the distinct role and risk of each term.",
    ],
    concepts: `Feedback compares what you want with what you measure and uses the difference to act. A toy car that adjusts steering from camera position can reject a side push; a fixed steering command cannot. Define reference r, measured output y_m, and error e = r - y_m. The controller produces u, the plant responds, and the sensor closes the loop. The sign matters: an action intended to reduce positive error must not increase it.

A continuous PID law is u(t) = K_p e(t) + K_i ∫e(t)dt + K_d de/dt. Proportional action reacts to present error. Integral action accumulates persistent error and can remove offset. Derivative action responds to change and can add damping, but it amplifies measurement noise and is often applied to measured output rather than a suddenly changing reference. In sampled code, one simple form uses I_k = I_{k-1} + e_kΔt and D_k = (e_k - e_{k-1})/Δt.

Actuators saturate. A PWM command cannot exceed its allowed range, and a motor driver cannot supply infinite voltage or current. If integration continues during saturation, the stored integral “winds up,” causing prolonged overshoot after the error changes sign. Clamp or condition integration, and record saturation explicitly. A specific build decision for a geared desk robot is to set output limits from driver and motor constraints before increasing K_i.

A common misconception is that PID terms are three magic improvements that should all be increased. More K_p can speed response but also magnify noise or excite oscillation; more K_i can correct bias but erode stability; K_d can become a noise command. Another failure is testing with the mechanism connected before confirming feedback direction. First command a small bounded output, observe sensor sign, and verify that the computed correction opposes displacement. PID does not compensate for an encoder that intermittently disconnects or a mechanically jammed axis.`,
    workedExample: {
      problem: "A sampled PI controller has K_p = 0.8 output/degree, K_i = 0.5 output/(degree·s), Δt = 0.10 s, prior integral I = 2.0 degree·s, reference 30°, and measurement 26°. Find the unconstrained output.",
      steps: [
        "Error is e = 30° - 26° = 4°.",
        "Update integral: I = 2.0 + 4 × 0.10 = 2.4 degree·s.",
        "Proportional contribution is 0.8 × 4 = 3.2 output units; integral contribution is 0.5 × 2.4 = 1.2.",
        "Total unconstrained output is u = 3.2 + 1.2 = 4.4 output units.",
      ],
      result: "The PI update commands 4.4 output units before saturation or direction mapping.",
      sanityCheck: "Positive reference error gives positive corrective output under the declared sign convention; reversing sensor polarity would make that dangerous.",
    },
    exercise: {
      question: "A position loop remains at a small constant error because proportional effort exactly balances a constant load. Which change most directly removes the offset?",
      choices: ["Add integral action with anti-windup", "Increase derivative action only", "Remove the sensor", "Reverse feedback polarity"],
      answerIndex: 0,
      explanation: "Integral action accumulates the persistent error until it supplies the needed bias; anti-windup keeps that state bounded during saturation. Derivative of a constant error is zero. Removing the sensor opens the loop, and reversing polarity creates positive feedback.",
    },
    lab: {
      goal: "Implement and diagnose a bounded position loop on a safe low-energy mechanism.",
      equipment: ["Low-voltage servo-like axis or motor with position sensor", "Current-limited supply", "Microcontroller", "Serial plotter", "Physical travel stops"],
      steps: [
        "With motor power disabled, move the axis by hand and confirm sensor direction and travel limits.",
        "Enable a small proportional-only output limit, apply a modest setpoint step, and record error, command, and saturation state.",
        "Add limited integral action only if a repeatable offset remains; compare settling and overshoot.",
        "Deliberate fault: invert the sensor sign in a software test while output remains tightly limited; identify growing error and disable immediately, then restore negative feedback.",
      ],
      observe: [
        "Expected: proportional control reduces error, and careful integral action reduces steady offset but may increase overshoot.",
        "Measure: actual reference, sensor value, command, sample time, and saturation; never substitute expected stability for a recorded trace.",
      ],
      transfer: "Specify output limits and anti-windup behavior for a camera pan axis that may hit a cable-imposed travel limit.",
      cautions: ["Use a low-energy axis, current limiting, clear stops, and an immediate power disconnect; never test first on an appliance or road vehicle."],
    },
    projectIds: ["desk-robot", "linkage"],
    glossary: ["feedback", "setpoint", "error", "pid", "saturation", "integral-windup"],
    sources: [CTMS, MODERN_ROBOTICS],
  },
  {
    id: "stability-tuning",
    track: "control",
    title: "Stability and responsible tuning",
    summary: "Recognize unstable or weakly damped behavior and tune a bounded loop from evidence rather than gain folklore.",
    minutes: 65,
    level: "Advanced",
    prerequisites: ["feedback-pid"],
    outcomes: [
      "Distinguish stable, marginal, and unstable response from a time trace.",
      "Tune a low-energy loop systematically while respecting delay, saturation, and mechanical limits.",
    ],
    concepts: `A controller can reduce error at first and still be unsafe. Stability asks what happens to bounded disturbances and initial errors over time. If deviations decay, the operating point is asymptotically stable; if they persist without decay it may be marginal; if they grow, it is unstable. A practical response can also be stable yet poor because it rings, overshoots a stop, or settles too slowly.

For a common second-order model, ÿ + 2ζω_n ẏ + ω_n²y = ω_n²u. Natural frequency ω_n sets a time scale, while damping ratio ζ shapes the transient. For 0 < ζ < 1, percent overshoot is approximately 100 exp[-ζπ/√(1-ζ²)]. Delay adds phase lag: sensing, filtering, computation, communication, and actuator response all mean correction arrives late. Raising loop gain then makes the controller chase old information and can turn damping into oscillation.

Responsible tuning begins with verified feedback sign, conservative output and travel limits, a repeatable test input, and logged signals. Increase proportional gain gradually until response is useful but not persistently oscillatory, then add only the action needed for a diagnosed limitation. Change one parameter at a time and return to a known-safe setting after anomalies. The build decision may be to reduce sample delay or mechanical backlash rather than “tune around” them.

A common misconception is that the highest gain before obvious oscillation is optimal. Noise, payload changes, battery voltage, and untested positions can erase that narrow margin. Another is interpreting a clipped oscillation as stable because its amplitude no longer grows; actuator saturation may merely bound an unstable linear tendency while heating hardware. Do not use aggressive self-oscillation tuning on fragile mechanisms. A clean simulation trace is evidence about its model, not proof that a camera arm or toy car will behave identically.`,
    workedExample: {
      problem: "A measured step response peaks at 12.0° for a 10.0° command, then settles at 10.0°. Estimate percent overshoot and damping ratio using the second-order approximation.",
      steps: [
        "Percent overshoot is (12.0 - 10.0)/10.0 × 100 = 20%.",
        "Let M_p = 0.20. Rearranging the overshoot relation gives ζ = -ln(M_p)/√(π² + ln²(M_p)).",
        "ζ = 1.609/√(9.870 + 2.590) = 1.609/3.530 = 0.456.",
      ],
      result: "The response has 20% overshoot and an estimated damping ratio of about 0.46 under the second-order assumption.",
      sanityCheck: "A damping ratio between 0 and 1 is consistent with an oscillatory response, and ζ near 0.45 commonly implies noticeable overshoot rather than none.",
    },
    exercise: {
      question: "After adding a long moving-average filter, a formerly well-behaved motor loop oscillates. What is the strongest first hypothesis?",
      choices: ["The filter added delay and phase lag", "Filtering always increases motor torque", "The setpoint unit changed automatically", "The mechanism gained a joint"],
      answerIndex: 0,
      explanation: "A long averaging window delays the measurement used for correction, reducing stability margin. It does not inherently add torque, change units, or alter mechanical degrees of freedom. Verify timing before retuning gains.",
    },
    lab: {
      goal: "Compare settling, overshoot, and disturbance recovery across conservative gain settings.",
      equipment: ["Low-voltage closed-loop axis", "Current-limited supply", "Microcontroller logger", "Soft travel stops", "Small removable payload"],
      steps: [
        "Verify sign and limits, choose a small step away from end stops, and define metrics before enabling motion.",
        "Run three conservative proportional gains one at a time, returning to zero output between trials; log reference, output, and command.",
        "Choose the least aggressive acceptable gain and repeat with a small payload disturbance.",
        "Deliberate fault: add a known software measurement delay at low output limit; diagnose increased overshoot or oscillation from aligned timestamps, then remove it.",
      ],
      observe: [
        "Expected: gain initially speeds correction, but delay and higher gain reduce damping and robustness.",
        "Measure: actual peak, settling band, sample interval, delay, command clipping, and payload; expected trends are not substitute data.",
      ],
      transfer: "Write acceptance limits for a screen-tilt mechanism, including maximum overshoot, settling time, and a safe rollback setting.",
      cautions: ["Keep energy, current, speed, and travel limited; stop on growing oscillation, impact, unexpected heat, or sensor dropout."],
    },
    projectIds: ["desk-robot", "linkage"],
    glossary: ["stability", "damping-ratio", "overshoot", "settling-time", "phase-lag", "stability-margin"],
    sources: [CTMS, MODERN_ROBOTICS],
  },
  {
    id: "filtering-estimation",
    track: "control",
    title: "Filtering and state estimation",
    summary: "Reduce measurement noise without hiding motion, delay, or faults, and quantify what an estimate can support.",
    minutes: 60,
    level: "Practice",
    prerequisites: ["probability-uncertainty", "signals-systems"],
    relatedStudy: ["adc-sampling"],
    outcomes: [
      "Implement and analyze a moving-average or exponential low-pass filter.",
      "Separate measurement, estimate, residual, and true-but-unknown state in a diagnostic record.",
    ],
    concepts: `Sensors do not reveal truth directly. A camera-derived position jitters, an ADC includes quantization and electrical noise, and a distance sensor may occasionally return an outlier. Filtering combines measurements over time to make a more useful estimate. The cost is usually delay or reduced ability to follow rapid change.

An N-sample moving average is ȳ_k = (1/N)Σx_{k-i}. For independent zero-mean noise with standard deviation σ, its standard deviation falls ideally to σ/√N, but the window delays changing signals. An exponential filter uses ŷ_k = αx_k + (1-α)ŷ_{k-1}, with 0 < α ≤ 1. Smaller α smooths more and responds more slowly. A state estimator goes further by combining a process model and measurement uncertainty; even a simple “predict, compare residual, correct” loop makes its assumptions explicit.

The residual r_k = measurement - predicted measurement is diagnostically valuable. Random residuals near zero may support the model; persistent bias suggests calibration error or an unmodelled force; abrupt large residuals may signal dropout or impact. Do not silently discard inconvenient readings. Record raw data, estimate, filter parameters, timestamp, saturation, and rejection decisions. For a camera mount, the build decision could be a modest filter that reduces pixel jitter while preserving enough bandwidth to track intentional pan motion.

A common misconception is that a smoother plot is more accurate. Heavy filtering can produce a clean but late estimate and hide a loose connector. Another is treating a filter's output as a physical measurement; it is a computed estimate based on assumptions. Averaging correlated drift does not remove the drift as σ/√N predicts. Choose filter bandwidth relative to system dynamics, examine residuals, and test known changes. If control stability worsens after filtering, added delay may outweigh reduced noise.`,
    workedExample: {
      problem: "A distance sensor reports 100, 104, 98, and 102 mm. Compute the four-sample mean and the ideal standard-deviation reduction factor for independent noise.",
      steps: [
        "Sum readings: 100 + 104 + 98 + 102 = 404 mm.",
        "Mean is 404 mm ÷ 4 = 101 mm.",
        "For independent zero-mean noise, standard deviation of the mean is σ/√4 = σ/2.",
      ],
      result: "The estimate is 101 mm, with an ideal random-noise standard deviation half that of one reading.",
      sanityCheck: "The mean lies within the observed 98–104 mm range; the uncertainty claim does not cover bias or correlated drift.",
    },
    exercise: {
      question: "A larger moving-average window makes a stationary trace smoother but causes a robot to react late to obstacles. What explains both effects?",
      choices: ["The window reduces high-frequency variation but adds delay", "The sensor's physical range increases", "Averaging removes every bias", "The sample clock becomes continuous"],
      answerIndex: 0,
      explanation: "A longer window attenuates fast variation by combining older samples, so real changes also arrive later in the estimate. It does not expand range, remove systematic bias, or turn sampled data into continuous time.",
    },
    lab: {
      goal: "Compare raw, filtered, and residual signals during stationary and moving tests.",
      equipment: ["Low-voltage distance or light sensor", "Microcontroller", "Serial logger", "Movable target", "Ruler"],
      steps: [
        "Log raw readings from a fixed target and predict how windows N = 1, 4, and 16 will affect scatter and response time.",
        "Move the target by a measured amount at a marked time; compute each moving average without deleting raw samples.",
        "Compare actual scatter, time to cross 90% of the change, and residuals for each window.",
        "Deliberate fault: briefly cover or disconnect the sensor within its safe interface; diagnose the outlier/dropout from raw data and residual rather than masking it with a long average.",
      ],
      observe: [
        "Expected: longer windows reduce stationary scatter but delay the measured step.",
        "Measure: actual raw range, filtered crossing time, residuals, and dropout code; identify assumptions behind any uncertainty estimate.",
      ],
      transfer: "Choose and justify a filter for a desk robot that must ignore millimetre jitter yet detect a hand approaching within 0.3 s.",
      cautions: ["Use only sensor-safe low-voltage wiring and disconnect power before changing connections."],
    },
    projectIds: ["sensor", "desk-robot"],
    glossary: ["moving-average", "low-pass-filter", "estimate", "residual", "noise", "bias"],
    sources: [CTMS, MODERN_ROBOTICS],
  },
  {
    id: "system-identification",
    track: "control",
    title: "System identification",
    summary: "Fit a useful dynamic model from designed experiments and validate it on data not used for fitting.",
    minutes: 70,
    level: "Advanced",
    prerequisites: ["experimental-method", "signals-systems"],
    relatedStudy: ["filtering-estimation"],
    outcomes: [
      "Estimate gain, offset, and time constant from input-output data.",
      "Validate a model using residuals and a separate experiment before using it for design.",
    ],
    concepts: `System identification works backward from observed inputs and outputs to a model. Rather than assuming a fan, heater, or motor matches a nominal equation, excite it safely, record what happened, choose a model class, estimate parameters, and test predictions. The goal is not the most complicated model; it is a model accurate enough for a stated decision within a stated operating region.

For a first-order model τdy/dt + y = Ku + b, steady tests at several inputs can estimate gain K and offset b from a line y_ss = Ku + b. A step response can estimate τ from the time to reach 63.2% of the change after accounting for offset and any dead time. Parameter fitting minimizes an error such as sum of squared residuals Σ(y_k - ŷ_k)², but a low fit error alone is not validation.

Excitation must reveal the dynamics without leaving safe operation. An input that barely changes will be dominated by noise; a single large step may trigger saturation or a different regime. Use several bounded levels, timestamps from the same clock when possible, and record battery voltage, payload, and environment. Reserve a separate dataset or input pattern for validation. A useful build decision might be whether one speed model covers a toy car both unloaded and carrying a camera; if residuals depend on payload, it likely does not.

A common misconception is that correlation establishes the plant model. Input and output can move together because of shared trends, feedback, or a hidden variable. Another failure is fitting and judging on the same trace, which rewards overfitting. Inspect residuals versus time and input: structure means information remains unexplained. Never extend the model beyond tested voltage, speed, temperature, or load without marking that extrapolation. Identification estimates behavior; it does not certify a mechanism or make unsafe testing acceptable.`,
    workedExample: {
      problem: "A low-voltage motor reaches 210 rpm at 2.0 V and 450 rpm at 4.0 V under the same load. Assume y_ss = Ku + b. Estimate K and b, then predict 3.0 V speed.",
      steps: [
        "Gain K = (450 - 210) rpm ÷ (4.0 - 2.0) V = 120 rpm/V.",
        "Offset b = 210 rpm - (120 rpm/V × 2.0 V) = -30 rpm.",
        "At 3.0 V, predicted speed is 120 × 3.0 - 30 = 330 rpm.",
      ],
      result: "The fitted local model is y = 120u - 30 rpm and predicts 330 rpm at 3.0 V.",
      sanityCheck: "The 3.0 V prediction lies halfway between the two measured speeds, as linear interpolation requires; the negative intercept is not a claim that reverse speed occurs at 0 V.",
    },
    exercise: {
      question: "A model fits its training step almost perfectly but predicts a second step poorly. What is the best conclusion?",
      choices: ["The model has not validated for that condition", "The second measurement must be discarded", "Perfect training fit proves the physics", "Increase numerical precision only"],
      answerIndex: 0,
      explanation: "Performance on separate data is the validation test; poor prediction shows the model class, parameters, or operating assumptions are insufficient. Discarding inconvenient data or equating fit with physics hides the problem, and extra digits cannot repair structural mismatch.",
    },
    lab: {
      goal: "Identify and validate a local static-plus-first-order model for a low-energy system.",
      equipment: ["Low-voltage motor with speed sensor or small fan with airflow proxy", "Current-limited supply", "Microcontroller logger", "Stopwatch"],
      steps: [
        "Choose three bounded input levels and a separate validation level; state the safe operating range and expected trend.",
        "Record actual steady outputs at the fitting levels, then apply one modest step and estimate gain, offset, and τ.",
        "Predict the reserved validation trace before running it; compare residuals and settling time.",
        "Deliberate fault: add a small payload or partially obstruct only the bench-scale airflow path; diagnose systematic residual change as an operating-condition mismatch.",
      ],
      observe: [
        "Expected: the fitted model predicts best near tested conditions and degrades when load changes.",
        "Measure: actual input, output, timestamps, supply voltage, load, parameter estimates, and residuals; never fabricate smooth values.",
      ],
      transfer: "Plan identification data needed before selecting feedforward commands for a camera pan axis at two payloads.",
      cautions: ["Use a guarded low-voltage bench device; do not open or probe an energized household fan or vacuum cleaner."],
    },
    projectIds: ["desk-robot", "sensor"],
    glossary: ["system-identification", "model-validation", "excitation", "parameter", "residual", "extrapolation"],
    sources: [CTMS],
  },
  {
    id: "trajectories-motion",
    track: "control",
    title: "Trajectories and motion profiles",
    summary: "Generate reachable position commands with bounded velocity and acceleration instead of demanding an instantaneous jump.",
    minutes: 60,
    level: "Advanced",
    prerequisites: ["mechanisms-kinematics", "rates-integration"],
    relatedStudy: ["feedback-pid", "timers-pwm"],
    outcomes: [
      "Calculate triangular and trapezoidal motion-profile times from distance, speed, and acceleration limits.",
      "Select motion limits from actuator, mechanism, payload, and task constraints.",
    ],
    concepts: `A position setpoint that jumps instantly implies unbounded velocity and acceleration. Real printer carriages, camera axes, and toy cars cannot follow it. A trajectory supplies desired position, velocity, and sometimes acceleration over time so the controller receives a physically plausible request. Smooth motion reduces tracking error, current peaks, belt slip, spilled payloads, and blurred images.

For one-dimensional travel D with acceleration magnitude a_max and speed limit v_max, a trapezoidal profile accelerates for t_a = v_max/a_max, cruises, then decelerates symmetrically. Acceleration distance is v_max²/(2a_max) per ramp. If D is less than v_max²/a_max, there is no cruise segment; the profile is triangular with peak speed v_peak = √(Da_max) and total time 2√(D/a_max). Position is the integral of velocity, and velocity is the integral of acceleration, so units provide a powerful check.

Limits should reflect more than motor capability. A long camera arm magnifies base torque; a flexible printer belt rings after sharp acceleration; a rolling robot loses traction if requested force exceeds available friction. Coordinate multiple joints by giving faster axes longer, gentler profiles or scaling them to finish together. The build decision is to cap acceleration for image stability even when the motor could move faster.

A common misconception is that a high-rate controller automatically makes a step command smooth. Sampling a discontinuity more often leaves it discontinuous. Another failure is applying independent joint profiles that collide midway despite safe start and end poses. Check the whole path, joint limits, singularities, and cable routing. Motion planning models commanded behavior; actual velocity and acceleration must be measured or estimated, and saturation means the plant may lag the planned trajectory.`,
    workedExample: {
      problem: "Move a camera slide D = 0.50 m with v_max = 0.40 m/s and a_max = 0.80 m/s². Determine profile shape and total time.",
      steps: [
        "Time to speed limit is t_a = 0.40/0.80 = 0.50 s.",
        "Distance during each acceleration ramp is v²/(2a) = 0.16/1.6 = 0.10 m; both ramps use 0.20 m.",
        "Remaining cruise distance is 0.50 - 0.20 = 0.30 m, so cruise time is 0.30/0.40 = 0.75 s.",
        "Total time is 0.50 + 0.75 + 0.50 = 1.75 s, so the profile is trapezoidal.",
      ],
      result: "Command 0.50 s acceleration, 0.75 s cruise, and 0.50 s deceleration for a 1.75 s move.",
      sanityCheck: "Average speed is 0.50/1.75 = 0.286 m/s, below the 0.40 m/s peak as required.",
    },
    exercise: {
      question: "A move is too short to reach v_max before it must decelerate. Which profile results under symmetric acceleration limits?",
      choices: ["Triangular velocity", "Constant position", "Instantaneous velocity step", "Sinusoidal position with unlimited acceleration"],
      answerIndex: 0,
      explanation: "Acceleration switches from positive to negative at a peak below v_max, producing a triangular velocity trace. The other choices either do not move or retain physically impossible discontinuities.",
    },
    lab: {
      goal: "Compare step and ramped commands on a low-energy position axis.",
      equipment: ["Low-voltage servo or motorized slide", "Microcontroller", "Current-limited supply", "Position logging", "Small camera-sized dummy mass"],
      steps: [
        "Set conservative travel, speed, and output limits and predict peak velocity for a triangular move.",
        "Run a small position step and a bounded trapezoidal or triangular command over the same distance; log reference and actual position.",
        "Compare peak following error, settling, and any visible payload vibration.",
        "Deliberate fault: request a profile above the configured speed limit; diagnose command clipping and growing tracking lag from logs rather than raising gains immediately.",
      ],
      observe: [
        "Expected: the bounded trajectory lowers abrupt error and mechanical excitation at the cost of planned move time.",
        "Measure: actual move time, peak error, saturation, and oscillation; expected smoothness is not evidence of measured acceleration.",
      ],
      transfer: "Design a pan trajectory that moves a camera 60° while limiting blur and finishing synchronously with a 20° tilt move.",
      cautions: ["Use soft stops, a dummy payload, low voltage, and clear space through the entire swept path."],
    },
    projectIds: ["desk-robot", "linkage"],
    glossary: ["trajectory", "velocity", "acceleration", "trapezoidal-profile", "tracking-error", "motion-limit"],
    sources: [MODERN_ROBOTICS, CTMS],
  },
  {
    id: "sensor-fusion",
    track: "control",
    title: "Sensor fusion",
    summary: "Combine complementary measurements while preserving frames, calibration, uncertainty, and fault evidence.",
    minutes: 65,
    level: "Advanced",
    prerequisites: ["vectors-frames", "filtering-estimation"],
    relatedStudy: ["digital-interfaces"],
    outcomes: [
      "Fuse two scalar estimates using stated uncertainty assumptions.",
      "Identify frame, timing, bias, and correlation failures that make a fused result misleading.",
    ],
    concepts: `Different sensors fail differently. Wheel encoders give smooth short-term displacement but drift during slip; a camera can correct global position but may update slowly or lose features. An accelerometer reacts quickly but includes gravity and bias; a slow reference can anchor it. Fusion uses complementary information, not merely more numbers.

For two independent unbiased scalar estimates x₁ and x₂ with variances σ₁² and σ₂², inverse-variance fusion is x̂ = (x₁/σ₁² + x₂/σ₂²)/(1/σ₁² + 1/σ₂²). Its variance is 1/(1/σ₁² + 1/σ₂²). The more precise estimate receives more weight. This result depends on independence, correct uncertainty, a shared physical quantity, synchronized time, and compatible coordinates. If both estimates share the same calibration error, treating them as independent becomes overconfident.

Before combining vectors, transform them into one declared frame. A camera's right direction may not match a robot's lateral axis, and an accelerometer mounted upside down changes signs. Align timestamps or propagate older estimates forward with a model. Compute innovations—the difference between prediction and new measurement—and retain them for gating and diagnosis. The build decision may be to reject a camera update when its residual is physically implausible while continuing short-term encoder prediction and explicitly increasing uncertainty.

A common misconception is that averaging two sensors always improves accuracy. A biased sensor can pull the result away from truth; duplicated sensors exposed to the same vibration have correlated errors. Another failure is assigning tiny uncertainty because a trace looks smooth. Calibration, latency, quantization, environment, and model error all matter. Fusion should report confidence and degraded modes, not conceal disagreement. For a desk robot, stopping or slowing after prolonged localization disagreement is often sounder than trusting a polished but unsupported estimate.`,
    workedExample: {
      problem: "An encoder estimates travel as 1.20 m with σ = 0.10 m; a camera estimates 1.05 m with σ = 0.05 m. Assuming independent unbiased errors, compute the fused estimate.",
      steps: [
        "Weights are inverse variances: encoder 1/0.10² = 100 m⁻²; camera 1/0.05² = 400 m⁻².",
        "Fused value is (100×1.20 + 400×1.05)/(100+400) = 540/500 = 1.08 m.",
        "Fused standard deviation is √(1/500) m = 0.0447 m.",
      ],
      result: "The fused estimate is 1.08 m with modeled standard deviation about 0.045 m.",
      sanityCheck: "The estimate lies between inputs and closer to the more precise camera value; confidence is only slightly better than 0.05 m because the camera already dominates.",
    },
    exercise: {
      question: "Two position sensors share the same incorrectly measured scale factor. Why is naive inverse-variance fusion risky?",
      choices: ["Their errors are correlated and biased", "More sensors eliminate calibration", "Variance has no units", "The fused value must equal zero"],
      answerIndex: 0,
      explanation: "A shared scale error violates the independent, unbiased assumptions, so the calculated confidence is too optimistic and the fused estimate remains biased. More sensors do not erase shared calibration; variance does have squared units; zero is unrelated.",
    },
    lab: {
      goal: "Fuse two position estimates and use disagreement to detect a sensor fault.",
      equipment: ["Toy car or sliding target", "Measured track", "Wheel/rotation counts or marked ruler readings", "Camera or second observer", "Spreadsheet or script"],
      steps: [
        "Define a common origin, positive direction, timestamps, and estimated uncertainty for both methods.",
        "Move through several known marks, record actual independent readings, and compute weighted fused positions.",
        "Plot each residual against the track reference and check whether errors appear biased or correlated.",
        "Deliberate fault: introduce one wheel-slip event or a fixed camera offset; diagnose it from innovation and persistent residual pattern before changing weights.",
      ],
      observe: [
        "Expected: fusion helps when errors are roughly independent and calibrated; a shared or biased error survives.",
        "Measure: actual estimates, timestamps, reference positions, residuals, and chosen variances; label reference uncertainty too.",
      ],
      transfer: "Define a degraded mode for a desk robot when encoder and camera position disagree beyond a justified threshold for three updates.",
      cautions: ["Use a slow, low-energy cart on a clear tabletop or floor track; do not adapt this experiment to a road vehicle."],
    },
    projectIds: ["desk-robot", "sensor"],
    glossary: ["sensor-fusion", "variance", "calibration", "coordinate-frame", "innovation", "correlated-error"],
    sources: [MODERN_ROBOTICS],
  },
  {
    id: "control-discretization",
    track: "control",
    title: "Discretizing control for firmware",
    summary: "Translate continuous control ideas into timed, bounded firmware updates without losing units or stability margin.",
    minutes: 70,
    level: "Advanced",
    prerequisites: ["feedback-pid", "rates-integration", "timers-pwm"],
    relatedStudy: ["stability-tuning", "filtering-estimation"],
    outcomes: [
      "Implement discrete integration and differentiation with explicit sample interval and state.",
      "Diagnose jitter, missed deadlines, quantization, and saturation in a sampled control loop.",
    ],
    concepts: `A microcontroller acts at discrete instants. It reads sensors, updates controller state, and writes an actuator command. Continuous equations are useful designs, but firmware must choose a sample period, numerical approximation, state initialization, and behavior when execution is late. Those choices can change the closed loop.

Forward Euler integration uses x_{k+1} = x_k + Δt f(x_k, u_k). A discrete integral uses I_k = I_{k-1} + e_kΔt; a backward difference estimates derivative as (e_k - e_{k-1})/Δt. Omitting Δt makes gains depend accidentally on loop frequency. For the first-order system dx/dt = -x/τ, forward Euler becomes x_{k+1} = (1 - Δt/τ)x_k. The approximation decays without sign flipping when 0 < Δt/τ < 1; for larger steps it can oscillate numerically, and at Δt/τ ≥ 2 it is unstable even though the continuous system is stable.

Sampling should be comfortably faster than the dynamics the loop must control, but “as fast as possible” is not a design. ADC settling, sensor buses, computation, PWM update timing, and logging consume time. Use a monotonic timer and measured Δt when appropriate; separate slow communication or screen updates from a time-critical loop. The build decision may be to keep control at 100 Hz while updating a display at 10 Hz, preventing rendering delays from becoming motor-command jitter.

A common misconception is that a nominal delay call guarantees a fixed period. Work performed in the loop adds time, interrupts add jitter, and blocking I/O can miss deadlines. Another failure is changing sample rate without retuning or rescaling discrete gains. Quantization can create limit cycles near a setpoint, while saturation can wind up hidden state. Log timestamps, execution duration, missed-deadline count, raw input, state, and bounded output. The GPIO state-machine simulation, if used, is a bounded behavioral timing model, not MCU emulation.`,
    workedExample: {
      problem: "Use forward Euler for dx/dt = -x/0.10 s from x₀ = 1.0. Compare one update with Δt = 0.02 s and Δt = 0.15 s.",
      steps: [
        "For 0.02 s, multiplier is 1 - 0.02/0.10 = 0.8, so x₁ = 0.8.",
        "For 0.15 s, multiplier is 1 - 0.15/0.10 = -0.5, so x₁ = -0.5.",
        "The exact continuous value after 0.02 s is e⁻⁰·² = 0.819; after 0.15 s it is e⁻¹·⁵ = 0.223, always positive.",
      ],
      result: "The 20 ms update is a reasonable first approximation; the 150 ms update creates an artificial sign reversal despite eventual numerical decay.",
      sanityCheck: "A decaying continuous state cannot cross zero in this model, so the negative discrete result exposes an overly coarse approximation.",
    },
    exercise: {
      question: "Firmware doubles its control-loop rate, but its integral update adds Ki×error each iteration with no Δt. What happens to integral action per real second?",
      choices: ["It approximately doubles", "It halves", "It stays identical", "It becomes derivative action"],
      answerIndex: 0,
      explanation: "Twice as many unscaled additions occur each second, so effective integral strength roughly doubles. Including Δt preserves units and rate independence. It neither halves nor changes into a derivative.",
    },
    lab: {
      goal: "Measure loop timing and show how blocking work alters a discrete controller.",
      equipment: ["Microcontroller", "Low-voltage LED or safely limited motor test rig", "Timer-capable firmware", "Serial logger", "Oscilloscope or logic analyzer optional"],
      steps: [
        "Implement a periodic state update using a monotonic timestamp and log actual Δt and execution duration.",
        "Run the loop with a bounded simulated first-order state or low-energy plant and compare 10 ms and 50 ms sample periods.",
        "Add a slow display/serial task on a separate schedule and confirm control timing remains within its deadline.",
        "Deliberate fault: insert a known blocking operation into the control path; diagnose missed deadlines and changed response from timestamps, then remove or reschedule it.",
      ],
      observe: [
        "Expected: coarser or jittery updates increase approximation and control error; separated slow tasks reduce interference.",
        "Measure: actual period distribution, deadline misses, state, and command; nominal configured period is not a measurement.",
      ],
      transfer: "Specify control, sensor, logging, and screen update rates for a desk robot and justify which tasks may skip an update.",
      cautions: ["Begin with a simulated state or LED; if using a motor, keep voltage, current, speed, and travel tightly limited."],
    },
    projectIds: ["desk-robot", "cyberdeck", "sensor"],
    glossary: ["sample-period", "discretization", "euler-method", "jitter", "deadline", "quantization"],
    sources: [CTMS, BLINK_WITHOUT_DELAY],
    simulation: "gpio-state-machine",
  },
];
