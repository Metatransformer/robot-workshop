const servoControllerPython = `"""Bounded hold-to-run command generator with no hardware dependencies."""

import math


class ServoController:
    RELEASE_SECONDS = 0.05
    SESSION_SECONDS = 5.0
    CENTER_US = 1500
    MIN_US = 1450
    MAX_US = 1550
    RATE_US_PER_SECOND = 50.0

    def __init__(self):
        self.state = "disarmed"
        self._last_now = None
        self._release_since = None
        self._session_start = None

    def _reset(self):
        self.state = "disarmed"
        self._last_now = None
        self._release_since = None
        self._session_start = None

    @classmethod
    def _triangle_pulse(cls, elapsed):
        phase = elapsed % 4.0
        if phase <= 1.0:
            pulse = cls.CENTER_US + cls.RATE_US_PER_SECOND * phase
        elif phase <= 3.0:
            pulse = cls.MAX_US - cls.RATE_US_PER_SECOND * (phase - 1.0)
        else:
            pulse = cls.MIN_US + cls.RATE_US_PER_SECOND * (phase - 3.0)
        return max(cls.MIN_US, min(cls.MAX_US, int(round(pulse))))

    def step(self, pressed: bool, now: float) -> int:
        """Return a commanded pulse in microseconds, or zero for no pulses."""
        try:
            timestamp = float(now)
        except (TypeError, ValueError, OverflowError):
            self._reset()
            return 0

        if not math.isfinite(timestamp):
            self._reset()
            return 0
        if self._last_now is not None and timestamp < self._last_now:
            self._reset()
            self._last_now = timestamp
            return 0
        self._last_now = timestamp

        if not pressed:
            self._session_start = None
            if self._release_since is None:
                self._release_since = timestamp
                self.state = "released"
            elif timestamp - self._release_since >= self.RELEASE_SECONDS:
                self.state = "armed"
            return 0

        self._release_since = None
        if self.state == "armed":
            self.state = "active"
            self._session_start = timestamp
            return self.CENTER_US

        if self.state != "active" or self._session_start is None:
            return 0

        elapsed = timestamp - self._session_start
        if elapsed < 0.0:
            self._reset()
            return 0
        if elapsed >= self.SESSION_SECONDS:
            self.state = "timeout"
            self._session_start = None
            return 0
        return self._triangle_pulse(elapsed)
`;

const codePython = `"""CircuitPython hardware wrapper for the bounded FS90 bench command."""

from servo_control import ServoController


def pulse_to_duty(pulse_us, actual_frequency):
    if pulse_us <= 0:
        return 0
    return round(pulse_us * actual_frequency * 65535 / 1_000_000)


def run(board_module=None, pwmio_module=None, digitalio_module=None, time_module=None):
    if board_module is None:
        import board as board_module
    if pwmio_module is None:
        import pwmio as pwmio_module
    if digitalio_module is None:
        import digitalio as digitalio_module
    if time_module is None:
        import time as time_module

    pwm = None
    button = None
    led = None
    controller = ServoController()
    last_report = None
    next_report = 0.0

    try:
        pwm = pwmio_module.PWMOut(
            board_module.GP0,
            frequency=50,
            duty_cycle=0,
        )
        button = digitalio_module.DigitalInOut(board_module.GP3)
        button.direction = digitalio_module.Direction.INPUT
        button.pull = digitalio_module.Pull.UP
        led = digitalio_module.DigitalInOut(board_module.LED)
        led.direction = digitalio_module.Direction.OUTPUT
        led.value = False

        while True:
            now = time_module.monotonic()
            pulse_us = controller.step(not button.value, now)
            pwm.duty_cycle = pulse_to_duty(pulse_us, pwm.frequency)
            led.value = pulse_us > 0

            report = controller.state
            if report != last_report or now >= next_report:
                print("state={} command_us={}".format(controller.state, pulse_us))
                last_report = report
                next_report = now + 0.5
            time_module.sleep(0.02)
    except KeyboardInterrupt:
        pass
    finally:
        if pwm is not None:
            pwm.duty_cycle = 0
        if led is not None:
            led.value = False
        for resource in (pwm, button, led):
            if resource is not None:
                resource.deinit()


if __name__ == "__main__":
    run()
`;

export const servoFirmwareFiles: Record<string, string> = {
  "firmware/code.py": codePython,
  "firmware/servo_control.py": servoControllerPython,
};
