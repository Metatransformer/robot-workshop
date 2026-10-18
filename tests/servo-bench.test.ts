import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { servoBenchFiles, servoBenchGuide } from "../src/lib/servo-bench";
import { servoFirmwareFiles } from "../src/lib/servo-firmware";

const pythonValidation = String.raw`
import json
import math
import sys
import types

payload = json.load(sys.stdin)
controller_source = payload["firmware/servo_control.py"]
wrapper_source = payload["firmware/code.py"]
compile(controller_source, "servo_control.py", "exec")
compile(wrapper_source, "code.py", "exec")

controller_module = types.ModuleType("servo_control")
exec(compile(controller_source, "servo_control.py", "exec"), controller_module.__dict__)
sys.modules["servo_control"] = controller_module
ServoController = controller_module.ServoController

controller = ServoController()
assert controller.step(True, 0.0) == 0
assert controller.state == "disarmed"
assert controller.step(True, 0.5) == 0
assert controller.step(False, 1.0) == 0
assert controller.state == "released"
assert controller.step(False, 1.049) == 0
assert controller.state == "released"
assert controller.step(False, 1.051) == 0
assert controller.state == "armed"
assert controller.step(True, 1.06) == 1500
assert controller.state == "active"

expected = [
    (1.56, 1525),
    (2.06, 1550),
    (3.06, 1500),
    (4.06, 1450),
    (4.56, 1475),
    (5.06, 1500),
    (5.56, 1525),
]
for now, pulse in expected:
    assert controller.step(True, now) == pulse, (now, controller.state)

for offset in [value / 100.0 for value in range(0, 500)]:
    pulse = ServoController._triangle_pulse(offset)
    assert 1450 <= pulse <= 1550

assert controller.step(True, 6.06) == 0
assert controller.state == "timeout"
assert controller.step(True, 7.0) == 0
assert controller.step(False, 7.01) == 0
assert controller.state == "released"
assert controller.step(False, 7.061) == 0
assert controller.state == "armed"
assert controller.step(True, 7.07) == 1500
assert controller.step(False, 7.071) == 0
assert controller.state == "released"

clock_fault = ServoController()
clock_fault.step(False, 10.0)
clock_fault.step(False, 10.1)
assert clock_fault.step(True, 10.2) == 1500
assert clock_fault.step(True, 9.0) == 0
assert clock_fault.state == "disarmed"
assert clock_fault.step(True, 9.1) == 0
assert clock_fault.step(False, 9.2) == 0
assert clock_fault.step(False, 9.251) == 0
assert clock_fault.step(True, 9.3) == 1500

for invalid in [float("nan"), float("inf"), float("-inf")]:
    invalid_clock = ServoController()
    invalid_clock.step(False, 0.0)
    invalid_clock.step(False, 0.1)
    assert invalid_clock.step(True, 0.2) == 1500
    assert invalid_clock.step(True, invalid) == 0
    assert invalid_clock.state == "disarmed"

wrapper_namespace = {"__name__": "code_test"}
exec(compile(wrapper_source, "code.py", "exec"), wrapper_namespace)
assert wrapper_namespace["pulse_to_duty"](1500, 73) == round(1500 * 73 * 65535 / 1_000_000)
assert wrapper_namespace["pulse_to_duty"](0, 73) == 0

class FakeBoard:
    GP0 = "GP0"
    GP3 = "GP3"
    LED = "LED"

class FakePwm:
    instances = []

    def __init__(self, pin, frequency, duty_cycle):
        assert pin == FakeBoard.GP0
        assert frequency == 50
        self.frequency = 73
        self.duties = [duty_cycle]
        self.deinitialized = False
        FakePwm.instances.append(self)

    @property
    def duty_cycle(self):
        return self.duties[-1]

    @duty_cycle.setter
    def duty_cycle(self, value):
        self.duties.append(value)

    def deinit(self):
        self.deinitialized = True

class FakePwmModule:
    PWMOut = FakePwm

class FakeDirection:
    INPUT = "input"
    OUTPUT = "output"

class FakePull:
    UP = "up"

class FakeDigital:
    instances = []
    button_values = iter([True, True, False])

    def __init__(self, pin):
        self.pin = pin
        self.direction = None
        self.pull = None
        self._value = False
        self.writes = []
        self.deinitialized = False
        FakeDigital.instances.append(self)

    @property
    def value(self):
        if self.pin == FakeBoard.GP3:
            return next(FakeDigital.button_values)
        return self._value

    @value.setter
    def value(self, new_value):
        self._value = new_value
        self.writes.append(new_value)

    def deinit(self):
        self.deinitialized = True

class FakeDigitalModule:
    DigitalInOut = FakeDigital
    Direction = FakeDirection
    Pull = FakePull

class FakeTime:
    times = iter([0.0, 0.06, 0.07])
    sleeps = []

    @classmethod
    def monotonic(cls):
        return next(cls.times)

    @classmethod
    def sleep(cls, duration):
        cls.sleeps.append(duration)
        if len(cls.sleeps) == 3:
            raise KeyboardInterrupt()

wrapper_namespace["run"](FakeBoard, FakePwmModule, FakeDigitalModule, FakeTime)
pwm = FakePwm.instances[0]
button, led = FakeDigital.instances
active_duty = round(1500 * pwm.frequency * 65535 / 1_000_000)
assert pwm.duties[0] == 0
assert active_duty in pwm.duties
assert pwm.duties[-1] == 0
assert button.direction == FakeDirection.INPUT
assert button.pull == FakePull.UP
assert led.direction == FakeDirection.OUTPUT
assert True in led.writes
assert led.writes[-1] is False
assert pwm.deinitialized and button.deinitialized and led.deinitialized
assert FakeTime.sleeps == [0.02, 0.02, 0.02]

# Changing commands must not trigger serial output every loop; stopping must
# deassert PWM before any optional stop-path reporting.
FakePwm.instances = []
FakeDigital.instances = []
FakeDigital.button_values = iter([True, True] + [False] * 201)
class TelemetryTime:
    ticks = iter([0.0, 0.06] + [0.07 + i * 0.02 for i in range(201)])
    count = 0
    stopping = False
    @classmethod
    def monotonic(cls):
        return next(cls.ticks)
    @classmethod
    def sleep(cls, duration):
        cls.count += 1
        if cls.count == 203:
            cls.stopping = True
            raise KeyboardInterrupt()
reports = []
def capture_report(message):
    if TelemetryTime.stopping:
        assert FakePwm.instances[0].duty_cycle == 0
    reports.append(message)
wrapper_namespace["print"] = capture_report
wrapper_namespace["run"](FakeBoard, FakePwmModule, FakeDigitalModule, TelemetryTime)
assert len(reports) <= 12, len(reports)
assert FakePwm.instances[0].duty_cycle == 0

# An LED initialization failure still cleans up previously acquired resources.
FakePwm.instances = []
FakeDigital.instances = []
class PartialDigitalModule:
    Direction = FakeDirection
    Pull = FakePull
    @staticmethod
    def DigitalInOut(pin):
        if pin == FakeBoard.LED:
            raise RuntimeError("LED init failure")
        return FakeDigital(pin)
try:
    wrapper_namespace["run"](FakeBoard, FakePwmModule, PartialDigitalModule, FakeTime)
    assert False, "initialization error was swallowed"
except RuntimeError:
    pass
assert FakePwm.instances[0].duty_cycle == 0
assert FakePwm.instances[0].deinitialized
assert FakeDigital.instances[0].deinitialized
`;

describe("FS90 bounded servo bench", () => {
  it("executes the exported controller and hardware wrapper without hardware", () => {
    const result = spawnSync("python3", ["-c", pythonValidation], {
      input: JSON.stringify(servoFirmwareFiles),
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it("exports the complete source packet at stable paths", () => {
    expect(Object.keys(servoFirmwareFiles).sort()).toEqual([
      "firmware/code.py",
      "firmware/servo_control.py",
    ]);
    expect(Object.keys(servoBenchFiles).sort()).toEqual([
      "BUY_AND_BUILD.md",
      "ENGINEERING.md",
      "README.md",
      "WIRING.md",
      "firmware/code.py",
      "firmware/servo_control.py",
      "notes/bench-log.csv",
    ]);
    expect(servoBenchFiles["firmware/code.py"]).toBe(servoFirmwareFiles["firmware/code.py"]);
    expect(servoBenchFiles["firmware/servo_control.py"]).toBe(servoFirmwareFiles["firmware/servo_control.py"]);
    expect(servoBenchFiles).not.toHaveProperty("main.py");
  });

  it("assembles every guide section and source into the printable file", () => {
    const printable = servoBenchFiles["BUY_AND_BUILD.md"];
    expect(printable).toContain(`# ${servoBenchGuide.title}`);
    for (const section of servoBenchGuide.sections) {
      expect(printable).toContain(`## ${section.title}`);
      expect(printable).toContain(section.markdown);
    }
    for (const source of servoBenchGuide.sources) {
      expect(printable).toContain(`[${source.title}](${source.url})`);
    }
  });

  it("preserves the exact route, evidence gaps, and required log fields", () => {
    const printable = servoBenchFiles["BUY_AND_BUILD.md"];
    expect(printable).toContain("positional FEETECH FS90");
    expect(printable).toContain("not FS90R continuous rotation, FS90-FB, or SG92R");
    expect(printable).toContain("0.6 A stall at 6 V");
    expect(printable).toContain("reports 0.8 A at 6 V");
    expect(printable).toContain("not a hardware safety certification");
    expect(printable).toContain("LED alone cannot verify pulse width");
    expect(printable).toContain("/learn?lesson=torque-gearing");
    expect(servoBenchFiles["WIRING.md"]).toContain("VBUS 40, VSYS 39, or 3V3(OUT) 36");
    expect(servoBenchFiles["ENGINEERING.md"]).toContain("0.00784532 N·m = 0.08 kgf·cm");
    expect(servoBenchFiles["notes/bench-log.csv"]).toBe(
      "date,exact_variant,supply_rest_v,supply_moving_v,min_pulse_us,max_pulse_us,observed_angle_deg,startup_observation,release_observation,timeout_observation,current_a_if_instrumented,notes\n",
    );
  });
});
