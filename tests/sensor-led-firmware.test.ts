import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { parseSensorLog } from "../src/lib/sensor-log";
import { sensorLedFirmwareFiles } from "../src/lib/sensor-led-firmware";

const pythonValidation = String.raw`
import json
import math
import sys
import types

payload = json.load(sys.stdin)
indicator_source = payload["firmware/indicator.py"]
code_source = payload["firmware/code.py"]
compile(indicator_source, "indicator.py", "exec")
compile(code_source, "code.py", "exec")

indicator_module = types.ModuleType("indicator")
exec(compile(indicator_source, "indicator.py", "exec"), indicator_module.__dict__)
sys.modules["indicator"] = indicator_module
update_indicator = indicator_module.update_indicator

assert update_indicator(25, True) is False
assert update_indicator(28, False) is True
assert update_indicator(27, True) is True
assert update_indicator(26, True) is False
assert update_indicator(27, False) is False

for args in [
    (float("nan"), False),
    (float("inf"), False),
    (27, False, float("inf"), 26),
    (27, False, 28, float("nan")),
    (27, False, 26, 26),
    (27, False, 25, 26),
]:
    try:
        update_indicator(*args)
        raise AssertionError("invalid hysteresis input was accepted: %r" % (args,))
    except ValueError:
        pass


class StopLoop(BaseException):
    pass


def execute(addresses, sensor_specs, stop_after_one_second_sleeps):
    events = []
    output = []

    board_module = types.ModuleType("board")
    board_module.GP0 = "GP0"
    board_module.GP1 = "GP1"
    board_module.GP2 = "GP2"

    class FakeI2C:
        def __init__(self, scl, sda):
            assert (scl, sda) == (board_module.GP1, board_module.GP0)
            self.locked = False
            events.append(("i2c_init", scl, sda))

        def try_lock(self):
            self.locked = True
            return True

        def scan(self):
            assert self.locked
            events.append(("scan", tuple(addresses)))
            return list(addresses)

        def unlock(self):
            assert self.locked
            self.locked = False
            events.append(("unlock",))

    busio_module = types.ModuleType("busio")
    busio_module.I2C = FakeI2C

    class FakeDigitalInOut:
        instances = []

        def __init__(self, pin):
            assert pin == board_module.GP2
            self.pin = pin
            self.writes = []
            self._value = None
            self.__class__.instances.append(self)
            events.append(("digital_init", pin))

        def switch_to_output(self, value=False):
            self._value = bool(value)
            self.writes.append(self._value)
            events.append(("led", self._value))

        @property
        def value(self):
            return self._value

        @value.setter
        def value(self, value):
            self._value = bool(value)
            self.writes.append(self._value)
            events.append(("led", self._value))

    digitalio_module = types.ModuleType("digitalio")
    digitalio_module.DigitalInOut = FakeDigitalInOut

    class FakeSensor:
        def __init__(self, readings):
            self.readings = list(readings)
            self.index = 0
            self.current = None

        @property
        def temperature(self):
            item = self.readings[self.index]
            if isinstance(item, Exception):
                self.index += 1
                raise item
            self.current = item
            return item[0]

        @property
        def relative_humidity(self):
            return self.current[1]

        @property
        def pressure(self):
            value = self.current[2]
            self.index += 1
            return value

    remaining_specs = list(sensor_specs)

    def create_sensor(i2c, address):
        assert address in (0x76, 0x77)
        events.append(("sensor_init", address))
        if not remaining_specs:
            raise AssertionError("unexpected extra sensor initialization")
        return FakeSensor(remaining_specs.pop(0))

    basic_module = types.ModuleType("adafruit_bme280.basic")
    basic_module.Adafruit_BME280_I2C = create_sensor
    bme_package = types.ModuleType("adafruit_bme280")
    bme_package.basic = basic_module

    class FakeTime(types.ModuleType):
        def __init__(self):
            super().__init__("time")
            self.sleeps = []
            self.one_second_sleeps = 0
            self.timestamps = 0

        def sleep(self, duration):
            self.sleeps.append(duration)
            events.append(("sleep", duration))
            if duration == 1.0:
                self.one_second_sleeps += 1
                if self.one_second_sleeps >= stop_after_one_second_sleeps:
                    raise StopLoop()

        def monotonic(self):
            value = self.timestamps
            self.timestamps += 1
            return float(value)

    time_module = FakeTime()
    modules = {
        "board": board_module,
        "busio": busio_module,
        "digitalio": digitalio_module,
        "time": time_module,
        "adafruit_bme280": bme_package,
        "adafruit_bme280.basic": basic_module,
    }
    previous_modules = {name: sys.modules.get(name) for name in modules}
    sys.modules.update(modules)
    namespace = {"__name__": "firmware_test"}
    try:
        exec(compile(code_source, "code.py", "exec"), namespace)
        namespace["print"] = lambda *args, **kwargs: output.append(
            kwargs.get("sep", " ").join(str(arg) for arg in args)
        )
        try:
            namespace["run"]()
            raise AssertionError("firmware loop returned")
        except StopLoop:
            pass
    finally:
        for name, previous in previous_modules.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous

    led = FakeDigitalInOut.instances[0]
    return {
        "events": events,
        "output": output,
        "writes": led.writes,
        "sleeps": time_module.sleeps,
    }


normal = execute(
    [0x77],
    [[(25, 40, 1000), (28, 41, 999), (27, 42, 998), (26, 43, 997)]],
    4,
)
sensor_init_index = next(index for index, event in enumerate(normal["events"]) if event[0] == "sensor_init")
startup_writes = [event[1] for event in normal["events"][:sensor_init_index] if event[0] == "led"]
assert startup_writes == [False, True, False, True, False, True, False], startup_writes
assert normal["sleeps"][:6] == [0.2] * 6
assert normal["writes"][0] is False
assert normal["writes"][-4:] == [False, True, True, False]
assert sum(1 for line in normal["output"] if line == "timestamp,temp_c,humidity_pct,pressure_hpa,led") == 1
assert normal["output"][0].startswith("# STARTUP:")
assert "command only" in normal["output"][0]

code_namespace = {"__name__": "address_test"}
for name, module in {
    "board": types.SimpleNamespace(GP0="GP0", GP1="GP1", GP2="GP2"),
    "busio": types.ModuleType("busio"),
    "digitalio": types.ModuleType("digitalio"),
    "adafruit_bme280": types.SimpleNamespace(basic=types.ModuleType("basic")),
}.items():
    sys.modules[name] = module
exec(compile(code_source, "code.py", "exec"), code_namespace)
choose = code_namespace["choose_sensor_address"]
assert choose([0x76]) == 0x76
assert choose([0x76, 0x77], 0x77) == 0x77
read_sensor = code_namespace["read_sensor"]
for reading in [
    types.SimpleNamespace(temperature=math.nan, relative_humidity=40, pressure=1000),
    types.SimpleNamespace(temperature=25, relative_humidity=math.inf, pressure=1000),
    types.SimpleNamespace(temperature=25, relative_humidity=40, pressure=-math.inf),
]:
    try:
        read_sensor(reading)
        raise AssertionError("non-finite sensor value was accepted")
    except ValueError:
        pass

for addresses, message in [([], "not found"), ([0x76, 0x77], "ambiguous")]:
    fault = execute(addresses, [], 1)
    assert fault["writes"][:7] == [False, True, False, True, False, True, False]
    assert fault["writes"][-1] is False
    assert fault["writes"].count(True) == 3
    assert fault["sleeps"] == [0.2] * 6 + [1.0]
    assert any(message in line for line in fault["output"]), fault["output"]
    assert all(line.startswith("#") for line in fault["output"])

read_fault = execute(
    [0x76],
    [[(28, 40, 1000), RuntimeError("read exploded")], [(27, 41, 999)]],
    3,
)
read_rows = [line for line in read_fault["output"] if line and not line.startswith("#") and not line.startswith("timestamp")]
assert [row.rsplit(",", 1)[1] for row in read_rows] == ["1", "0"]
assert read_fault["writes"].count(True) == 4
assert read_fault["writes"][-1] is False
assert read_fault["sleeps"].count(1.0) == 3
assert any("sensor read failed" in line and "read exploded" in line for line in read_fault["output"])
assert sum(1 for line in read_fault["output"] if line == "timestamp,temp_c,humidity_pct,pressure_hpa,led") == 1
assert sum(1 for line in read_fault["output"] if line.startswith("# STARTUP:")) == 1

nonfinite_fault = execute(
    [0x76],
    [[(28, 40, 1000), (math.nan, 41, 999)], [(27, 42, 998)]],
    3,
)
nonfinite_rows = [line for line in nonfinite_fault["output"] if line and not line.startswith("#") and not line.startswith("timestamp")]
assert [row.rsplit(",", 1)[1] for row in nonfinite_rows] == ["1", "0"]
assert all("nan" not in row.lower() and "inf" not in row.lower() for row in nonfinite_rows)
assert nonfinite_fault["writes"].count(True) == 4
assert nonfinite_fault["writes"][-1] is False
assert any("non-finite" in line for line in nonfinite_fault["output"])

sys.stdout.write(json.dumps({"normal_output": "\n".join(normal["output"]) + "\n"}))
`;

describe("external LED sensor firmware", () => {
  it("executes hysteresis, startup, address, fault, and recovery behavior with mocked CircuitPython modules", () => {
    const result = spawnSync("python3", ["-c", pythonValidation], {
      input: JSON.stringify(sensorLedFirmwareFiles),
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr || result.stdout).toBe(0);

    const capture = JSON.parse(result.stdout) as { normal_output: string };
    const parsed = parseSensorLog(capture.normal_output);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.totalValidRows).toBe(4);
    expect(parsed.segments.flatMap((segment) => segment.samples.map((sample) => sample.led))).toEqual([0, 1, 1, 0]);
  });

  it("exports only the two standalone firmware files at stable paths", () => {
    expect(Object.keys(sensorLedFirmwareFiles).sort()).toEqual([
      "firmware/code.py",
      "firmware/indicator.py",
    ]);
  });
});
