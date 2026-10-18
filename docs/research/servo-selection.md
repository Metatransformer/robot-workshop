# Servo selection evidence — 2026-10-18

Decision: add a separate original Pico + FEETECH FS90 bench starter. Keep existing
SG92R desk-creature project unchanged. This is a researched prototype route, not a
physically verified design. Do not claim exact observed angle from commanded pulse.

| Candidate | Evidence | Remaining gap / decision |
| --- | --- | --- |
| TowerPro SG92R, Adafruit169 | Supplier nominal voltage/pulse guidance | Reviewed page does not establish startup/stall current or input thresholds; retain concept only. |
| TowerPro SG-5010, Adafruit155 | 4.8–6V; featured in Adafruit Pico servo example using external5V/common ground/GP0 | Larger mechanism; tutorial establishes an example, not SG92R qualification or current envelope. |
| FEETECH FS90, Pololu2818 | Seller explicitly supports3.3V/5V control; about120° across900–2100us, center1500us | Selected as exact positional variant. Conservative1450–1550us is our experiment window, not guaranteed physical clearance. |

Sources:
- https://www.adafruit.com/product/169
- https://www.adafruit.com/product/155
- https://learn.adafruit.com/use-dc-stepper-servo-motor-solenoid-rp2040-pico/servo-motors
- https://www.pololu.com/product/2818
- https://www.pololu.com/product/2818/specs
- https://www.pololu.com/file/0J1435/FS90-specs.pdf

Current evidence conflicts: Pololu reports600mA stall and200mA no-load at6V;
its stall footnote says seller measurement, subject to change. The linked PDF is
labelled FS90-C, with800mA stall and120mA no-load at6V (700/100mA at4.8V).
Do not merge these as a guaranteed rating for every FS90 revision. Planning an
external2A supply provides nominal headroom over both references but does not prove
transient response, connector quality or any current limitation. Do not deliberately
stall the servo to resolve this. Record received markings and observe unloaded
motion/supply droop first; obtain exact supplier clarification for loaded use.

Power/accessories:
- https://www.adafruit.com/product/276 regulated5V up to2A,5.5mmOD/2.1mmID positive-tip barrel; enclosed US-plug supply. Select appropriate regional certified equivalent if unavailable; verify polarity/output beforeconnection.
- https://www.adafruit.com/product/368 female2.1mm screw adapter, terminals marked for positive-tip input. Use properly terminated conductors suited to clamp; don't clamp loose Dupont pins.
- https://www.adafruit.com/product/1119 momentary button10pack,use1; verify fourleg internal pairs by unpowered continuity.
- https://www.adafruit.com/product/4883 originalPico+two loose20pinheaders, requires soldering.
- https://www.adafruit.com/product/239 breadboard forPico/button/signal only, NOTservo current path.
- https://www.adafruit.com/product/758 male/male jumper40pack forlogicconnections.
- https://www.adafruit.com/product/592 USB-A/MicroB data OR https://www.adafruit.com/product/3878 USB-C/MicroB data.
- https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf pinout:GP0pin1,GND3,GP3pin5,GND8; externalpositive nevertoVBUS40/VSYS39/3V3OUT36.
- https://circuitpython.org/board/raspberry_pi_pico/
- https://docs.circuitpython.org/en/latest/shared-bindings/pwmio/index.html duty_cycle16bit, initializezero/deinit; frequency actualproperty used in conversion.

The hold-to-run firmware is original and independent of the tutorial's full-sweep
code.5sec timeout and release disarm are behavioral bounds, not hardware interlocks.
Removing pulses does not prove torque release. External barrel disconnect is the
physical stop. Initial neutral command may jump: no horn/link during firsttest.

Connector candidate verified after initial notes:
https://www.adafruit.com/product/5515 is a17cm shrouded servo-to-three-male-jumper
adapter,26AWG. Keep signal male pin; power/ground must be properly terminated for
the screw clamp (cut/strip adapter ends only, not the servo's original lead; inspect
clamp compatibility/retention). Provide suitable stripped common-ground lead and
strain relief; disconnect all power before cable preparation. Do not pretend this
is a solderless plug-and-play power assembly. Wire stripper/cutter required.
