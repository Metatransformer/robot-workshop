# Wiring practice source boundary — checked 2026-10-18

The exercise preserves the original starter, not all possible valid BME280 wiring.
Original Pico RP2040: GP0 physical1→SDI/SDA; GP1 physical2→SCK/SCL;
3V3(OUT) physical36→VIN; GND physical38→GND. The fault uses GP2 physical4
in place of3V3(OUT), a GPIO endpoint rather than the specified supply.

Sources reopened for this slice:
- [Raspberry Pi original Pico numbered pinout, hosted by Adafruit](https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf)
- [Adafruit BME280 breakout pinouts](https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/pinouts)

The breakout distinguishes VIN input and3Vo regulated output. Its SDI/SCK pads
serve SDA/SCL in I2C mode. Ground is the shared reference. Claims apply to the
named breakout, not a bare Bosch sensor or visually similar board. The schematic
uses labeled endpoint columns, not package geometry. Generic breadboard a–e/f–j
strip grouping follows the existing assembly guide; inspect the actual board.

Exercise feedback must not infer measured voltages, damage, exact firmware errors,
or physical continuity from the displayed netlist. A missing ground or crossed
signal can prevent communication; actual behavior remains unmeasured. Unpowered
label/connection tracing and appropriate continuity checks precede power. A match
only means the four shown connections agree with the reference. No certification,
short-circuit solver, complete solder inspection or hardware validation is supplied.
