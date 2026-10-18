# Applied curriculum and everyday-object research

Primary sources checked by an independent web-research agent on 2026-10-18.
Curriculum sequencing and worked examples are our synthesis, not copied courseware.

- [MIT 2.007 machine design](https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/pages/syllabus/): actual machine elements, tolerances, experiments and communication.
- [MIT 6.002 circuits](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/): circuit models, switching, energy storage and dynamics.
- [Modern Robotics](https://modernrobotics.northwestern.edu/): rigid motion, kinematics, planning and control.
- [MIT Missing Semester](https://missing.csail.mit.edu/): practical computing tools, version control and debugging.
- [Adafruit continuity](https://learn.adafruit.com/multimeters/continuity), [battery guide](https://learn.adafruit.com/li-ion-and-lipoly-batteries).
- [Arduino nonblocking timing](https://docs.arduino.cc/built-in-examples/digital/BlinkWithoutDelay/), [MicroPython RP2](https://docs.micropython.org/en/latest/rp2/quickref.html).
- [Michigan control tutorials](https://ctms.engin.umich.edu/CTMS/): index verified; specific motor page returned 403, do not claim it was read.
- [KiCad](https://docs.kicad.org/9.0/en/getting_started_in_kicad/getting_started_in_kicad.html), [ngspice](https://ngspice.sourceforge.io/docs.html).

## Simulation reuse

[AVR8js](https://github.com/wokwi/avr8js/blob/main/README.md) is MIT-licensed AVR
machine-code emulation; firmware compilation and external hardware models are separate.
Wokwi elements are visuals, not electrical simulation. [Uno support](https://docs.wokwi.com/parts/wokwi-arduino-uno)
has documented feature limits. [RP2040js](https://github.com/wokwi/rp2040js) documents
flash-writing limitations; running our current CircuitPython sensor build unchanged
is unverified. Analytical labs and GPIO state machines must be labelled separately.

## Everyday objects

Observe normal external behavior and documentation, draw energy/information flow,
then test a low-voltage analogue. Unplugging an appliance does not make its interior
safe; these lessons need not require opening mains appliances or vehicle systems.

- Vacuum: supply → motor → impeller → pressure/flow → nozzle/filter/exhaust. Analogue:
  guarded 5V cooling fan, cardboard duct, fixed paper streamers; no dust/liquids.
  [Dyson filtration](https://www.dyson.com/discover/innovation/behind-the-invention/filtration-at-dyson).
- TV: power rails → processor/framebuffer → display driver → pixels/backlight, with
  controls/audio separate. Analogue: Pico + OLED checkerboard, 1024-byte framebuffer.
  [Samsung LCD backlight](https://semiconductor.samsung.com/support/tools-resources/dictionary/semiconductor-glossary-leds-blu/).
- Electric car: battery → driver → motor/gears → wheels; sensing and thermal/charging
  paths separate. Analogue: low-voltage tabletop cart, speed/distance/stop experiment.
  [US DOE components](https://afdc.energy.gov/vehicles/how-do-all-electric-cars-work).
- Washer: drive/drum, inlet/drain, door/level/speed sensing and state machine.
  Analogue: dry cardboard drum, LEDs for water states, lid input and fault timeout.
  [TI control design](https://www.ti.com/lit/ug/tidu466/tidu466.pdf).
- Thermostat: sensor → setpoint comparison → output → environment feedback.
  Analogue: existing Pico/BME280 LED indication, no building HVAC.
  [TI thermostat resources](https://www.ti.com/solution/thermostat).
- Door/barrier: actuator/linkage plus presence/position/obstruction state logic.
  Analogue: lightweight paper barrier, servo, buttons; not a safety-rated door.

## Verified supplier identities (no price/stock promises)

- Original Raspberry Pi Pico: https://www.raspberrypi.com/products/raspberry-pi-pico/ (choose exact Pico/H/W variant; not Pico 2 by silent substitution).
- Adafruit BME280 breakout 2652: https://www.adafruit.com/product/2652
- SG92R micro servo / Adafruit169: https://www.adafruit.com/product/169
- Raspberry Pi5: https://www.raspberrypi.com/products/raspberry-pi-5/ (RAM/storage/cooling/power separate).
- 5V fan / Adafruit3368: https://www.adafruit.com/product/3368 (0.2A supplier claim, cooling fan not vacuum blower).
- DRV8833 breakout / Adafruit3297: https://www.adafruit.com/product/3297 (match brushed-motor stall current/thermal duty; not an automatic brushless-fan driver).
- 128×64 OLED / Adafruit326: https://www.adafruit.com/product/326 (interfaces/board revision/cable matter).

Shopping UI must distinguish candidate vs design-reviewed vs physically tested,
required/owned/still-needed quantity, exact part/variant, board vs IC, hidden cables
and connectors, selection criteria and source date. A conceptual lesson never
silently produces an approved order. No purchases or affiliate tracking added.

Supplier identity review: [Adafruit product 169](https://www.adafruit.com/product/169) names **TowerPro SG92R**; TowerPro is the manufacturer and Adafruit the seller. Corrected the supplier mapping, without changing existing user catalog entries. Pico starter purchasing notes explicitly identify the original non-wireless board; see [Pico product family](https://www.raspberrypi.com/products/raspberry-pi-pico/).
