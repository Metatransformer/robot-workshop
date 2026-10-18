const indicatorPython = `"""Pure temperature hysteresis for the external sensor indicator."""

import math


def _finite_number(value, name):
    try:
        number = float(value)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError("%s must be a finite number" % name) from error
    if not math.isfinite(number):
        raise ValueError("%s must be a finite number" % name)
    return number


def update_indicator(temp_c, previous, high=28, low=26):
    """Return the active-high command using validated hysteresis thresholds."""
    temperature = _finite_number(temp_c, "temp_c")
    high_threshold = _finite_number(high, "high")
    low_threshold = _finite_number(low, "low")
    if low_threshold >= high_threshold:
        raise ValueError("low must be less than high")
    if temperature >= high_threshold:
        return True
    if temperature <= low_threshold:
        return False
    return bool(previous)
`;

const codePython = `"""BME280 CSV logger with an external LED for an original Raspberry Pi Pico."""

import math
import time

import board
import busio
import digitalio
from adafruit_bme280 import basic as adafruit_bme280
from indicator import update_indicator


HIGH_C = 28.0
LOW_C = 26.0
SAMPLE_SECONDS = 1.0
RETRY_SECONDS = 1.0
STARTUP_PULSE_SECONDS = 0.2

# Leave as None for automatic selection when exactly one supported address is found.
# If the scan reports both supported addresses, set this to 0x76 or 0x77 only
# after identifying which physical sensor this program should use.
ADDRESS = None
SUPPORTED_SENSOR_ADDRESSES = (0x76, 0x77)


def choose_sensor_address(scanned_addresses, requested_address=None):
    """Choose one supported address or raise a clear sensor fault."""
    found = tuple(address for address in SUPPORTED_SENSOR_ADDRESSES if address in scanned_addresses)
    if requested_address is not None:
        if requested_address not in SUPPORTED_SENSOR_ADDRESSES:
            raise ValueError("ADDRESS must be None, 0x76, or 0x77")
        if requested_address not in found:
            raise RuntimeError("requested BME280 address 0x%02X was not detected" % requested_address)
        return requested_address
    if not found:
        raise RuntimeError("BME280 not found at 0x76 or 0x77; check power and I2C wiring")
    if len(found) > 1:
        raise RuntimeError("BME280 scan is ambiguous (0x76 and 0x77); set ADDRESS explicitly")
    return found[0]


def scan_i2c(i2c):
    """Return an I2C scan while always releasing the shared bus lock."""
    while not i2c.try_lock():
        pass
    try:
        return tuple(i2c.scan())
    finally:
        i2c.unlock()


def initialize_sensor(i2c):
    """Scan for and initialize the selected BME280."""
    address = choose_sensor_address(scan_i2c(i2c), ADDRESS)
    sensor = adafruit_bme280.Adafruit_BME280_I2C(i2c, address=address)
    print("# BME280 ready at 0x%02X" % address)
    return sensor


def startup_indicator_test(led):
    """Command three startup pulses without claiming that physical light was observed."""
    print("# STARTUP: commanding three GP2 LED pulses; command only, not a light measurement")
    for _ in range(3):
        led.value = True
        time.sleep(STARTUP_PULSE_SECONDS)
        led.value = False
        time.sleep(STARTUP_PULSE_SECONDS)


def read_sensor(sensor):
    """Read and reject non-finite values before they can enter the CSV stream."""
    temp_c = float(sensor.temperature)
    humidity_pct = float(sensor.relative_humidity)
    pressure_hpa = float(sensor.pressure)
    if not all(math.isfinite(value) for value in (temp_c, humidity_pct, pressure_hpa)):
        raise ValueError("sensor returned a non-finite reading")
    return temp_c, humidity_pct, pressure_hpa


def run():
    # Original Pico wiring: GP2 physical pin 4 -> 1 kOhm resistor -> LED anode;
    # LED cathode -> GND physical pin 3. True is a commanded active-high output,
    # not a measurement of physical light. The BME280 remains on GP0 SDA / GP1 SCL.
    led = digitalio.DigitalInOut(board.GP2)
    led.switch_to_output(value=False)
    startup_indicator_test(led)

    i2c = None
    sensor = None
    indicator_state = False
    header_printed = False

    while True:
        if sensor is None:
            try:
                if i2c is None:
                    i2c = busio.I2C(board.GP1, board.GP0)
                sensor = initialize_sensor(i2c)
                if not header_printed:
                    print("timestamp,temp_c,humidity_pct,pressure_hpa,led")
                    header_printed = True
            except Exception as error:
                led.value = False
                indicator_state = False
                print("# ERROR: sensor initialization failed: %s; retrying in 1 second" % error)
                time.sleep(RETRY_SECONDS)
                continue

        try:
            temp_c, humidity_pct, pressure_hpa = read_sensor(sensor)
            next_state = update_indicator(temp_c, indicator_state, HIGH_C, LOW_C)
            led.value = next_state
            indicator_state = next_state
            print("%.1f,%.2f,%.2f,%.2f,%d" % (
                time.monotonic(),
                temp_c,
                humidity_pct,
                pressure_hpa,
                1 if indicator_state else 0,
            ))
            time.sleep(SAMPLE_SECONDS)
        except Exception as error:
            led.value = False
            indicator_state = False
            sensor = None
            print("# ERROR: sensor read failed: %s; retrying in 1 second" % error)
            time.sleep(RETRY_SECONDS)


if __name__ == "__main__":
    run()
`;

export const sensorLedFirmwareFiles: Record<string, string> = {
  "firmware/code.py": codePython,
  "firmware/indicator.py": indicatorPython,
};
