You are a Sol execution worker. You are not alone in this codebase. Root owns the architecture and contracts; implement exactly this bounded package, preserve others' edits. Your ONLY allowed file is named below. Any other created/modified file is a failure: stop/report needed changes. No git add/commit. No unrelated formatting/refactoring. Shared data is append-only, but your assigned new file is entirely yours.
Read src/lib/curriculum/types.ts and docs/plans/builder-academy.md. Export an array LearningModule[] named MODULE_EXPORT from ALLOWED_FILE with exactly the 16 assigned canonical IDs. Import types from ./types. No helper factory that substitutes generic lesson text. You may share source constants only. No placeholders, TODO lessons, invented evidence, paid services, copied textbook prose or unverified source URLs. Explain original theory accurately.
For EACH module: specific outcome; 220-420 words of concepts Markdown explaining ordinary intuition then formal idea/equations and a misconception/failure mode; concrete worked example with numerical units or trace/code reasoning, steps/result/sanity check; one genuinely diagnostic multiple-choice exercise with answerIndex and a detailed explanation including why common wrong reasoning fails; a feasible lab with equipment, steps, observations, deliberate fault diagnostic and a transfer task. Distinguish expected observations from actual measurements. Include low-voltage/unpowered constraints when applicable without repetitive generic warnings. Modules are introductions/review, not all mastery in their estimated minutes (30-75).
Prerequisites: foundation IDs only depend on earlier foundations; electronics on foundations/earlier electronics; mechanics on foundations/earlier mechanics; embedded on foundations/electronics/earlier embedded; control may depend on foundations/electronics/mechanics/embedded/earlier control; robotics on all previous tracks/earlier robotics. Use only canonical IDs from plan. No cycles.
Use 3-6 concise glossary term IDs per module (lowercase-hyphen, e.g. torque, pwm, time-constant, uncertainty). Root will create a rich glossary for the union. projectIds must be existing template IDs sensor/linkage/desk-robot/cyberdeck/blank. Explain specific build decision in summary/concepts (resistor size, gear ratio, fault isolation etc). Include meaningful everyday objects as examples: fan/vacuum blower, screen, toy car, camera, printer; don't instruct novice energized appliance disassembly.
Approved primary sources (verified by researcher; select relevant 1-3 per module):
https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/pages/syllabus/
https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/
https://modernrobotics.northwestern.edu/
https://missing.csail.mit.edu/
https://learn.adafruit.com/multimeters/continuity
https://docs.micropython.org/en/latest/rp2/quickref.html
https://docs.arduino.cc/built-in-examples/digital/BlinkWithoutDelay/
https://learn.adafruit.com/li-ion-and-lipoly-batteries
https://ctms.engin.umich.edu/CTMS/
https://docs.kicad.org/9.0/en/getting_started_in_kicad/getting_started_in_kicad.html
https://ngspice.sourceforge.io/docs.html
https://docs.circuitpython.org/projects/bme280/en/latest/examples.html
No claim that every particular example comes from those sources; examples are original instructional calculations. You may use stable course pages as further study. Do not expand sources by guessing URLs.
Simulation associations optional: dc-motor for torque-gearing/motor-drivers, rc-transient for capacitance-transients/signals-systems, power-budget for power-regulation/batteries-protection, gpio-state-machine for programming-state/mcu-gpio/timers-pwm. Be clear these are bounded analytical/behavioral models.
Run targeted TypeScript if possible, otherwise report root integration needed. Do NOT run whole repo suite while other files in progress. Do NOT dump giant diffs/logs. Return concise count, any uncertainties and exact file touched.
