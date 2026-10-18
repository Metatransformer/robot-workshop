# External sensor LED — source checks, 2026-10-18

Bounded original Pico RP2040 + Adafruit BME280 variant. Existing projects unchanged.

- https://www.adafruit.com/product/297: red 5mm LED, 25-pack; published forward voltage 1.8–2.2V is at 20mA, not at the proposed roughly 1mA operating point.
- https://www.adafruit.com/product/4294: 1kΩ ±5% axial resistor, 0.25W, 25-pack. One LED and one resistor used. Availability and price are not cached claims.
- https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf §5.5.3 table625: output high can droop under load; drive strength settings are not current regulators. Aggregate GPIO/QSPI current limits are not per-pin allowances.
- https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf: GP2 physical4, GND physical3; base sensor mapping unchanged.
- https://learn.adafruit.com/all-about-leds: LED polarity and series resistance background.

Chosen topology GP2 → 1kΩ → LED anode → cathode → GND. Separate strips for the three junctions; resistor output shares a strip with anode. Resistor must not be bypassed. Nominal assumed3.3V output and2V LED drop imply1.3mA and1.69mW. Neither actual current nor brightness is validated. At950Ω and assumed3.3V withzeroLEDdrop,3.47mA/11.5mW is only a resistor-present estimate, not short-circuit protection.

Firmware: off, three startup pulses, off, then sensor loop. Faults off and serial diagnostics, no fault blinking. Hysteresis28/26°C; CSV led is a command. Reviewer requires executable ambient-relative threshold experiments and explicit strip junctions. No hardware powered or measured in this cycle.

Additional verification: CircuitPython digitalio API documents switch_to_output(value=False)
(https://docs.circuitpython.org/en/latest/shared-bindings/digitalio/index.html).
Polarity explanation read at https://learn.adafruit.com/all-about-leds/what-is-an-led;
lead-length identification applies to untrimmed parts, so received-part verification
remains necessary. Do not generalize this page's reverse-bias reassurance to arbitrary LEDs.
