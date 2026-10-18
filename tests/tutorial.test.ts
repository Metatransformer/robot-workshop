import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scaffoldProject, validateProject } from "../src/lib/project-format";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "workshop-tutorial-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("first buildable tutorial", () => {
  it("scaffolds the Pico sensor build with executable guidance", async () => {
    const parent = await temporaryDirectory();
    const directory = path.join(parent, "pico-bme280");
    const project = await scaffoldProject(directory, { title: "Pico climate indicator", templateId: "sensor" });

    expect(project.model).toBe("none");
    expect(project.bom.map((entry) => entry.itemId)).toEqual(expect.arrayContaining([
      "raspberry-pi-pico",
      "adafruit-bme280",
      "generic-usb-data-cable",
      "generic-jumper-wires",
    ]));

    const readProjectFile = (relativePath: string) => readFile(path.join(directory, relativePath), "utf8");
    const [readme, engineering, wiring, firmware, behavior, benchLog] = await Promise.all([
      readProjectFile("README.md"),
      readProjectFile("ENGINEERING.md"),
      readProjectFile("WIRING.md"),
      readProjectFile("firmware/code.py"),
      readProjectFile("firmware/behavior.md"),
      readProjectFile("notes/bench-log.csv"),
    ]);

    expect(readme.match(/^\d+\./gm)).toHaveLength(9);
    expect(readme).toContain("[WIRING.md](WIRING.md)");
    expect(readme).toContain("[firmware/code.py](firmware/code.py)");
    expect(engineering).toContain("has not been physically built");
    expect(engineering).toContain("Pico physical pin 1, GP0");
    expect(engineering).toContain("Actual I2C address");
    expect(wiring).toContain("physical 36 3V3(OUT)");
    expect(wiring).toContain("https://docs.circuitpython.org/projects/bme280/en/latest/examples.html");
    expect(wiring).toContain("major version matches");
    expect(firmware).toContain("busio.I2C(board.GP1, board.GP0)");
    expect(firmware).toContain("Adafruit_BME280_I2C(i2c, address=address)");
    expect(firmware).toContain('print("timestamp,temp_c,humidity_pct,pressure_hpa,led")');
    expect(firmware).toMatch(/except Exception as error:\n\s+led\.value = False\n\s+indicator_state = False/);
    expect(behavior).toContain("0x76 or 0x77");
    expect(benchLog.trim().split(/\r?\n/)).toEqual([
      "timestamp_s,temp_c,humidity_pct,pressure_hpa,led,sensor_address,observation",
    ]);
    expect((await validateProject(directory)).valid).toBe(true);
  });

  it("exercises hysteresis and sensor fault decisions with Python", async () => {
    const parent = await temporaryDirectory();
    const directory = path.join(parent, "pico-bme280");
    await scaffoldProject(directory, { title: "Pico climate indicator", templateId: "sensor" });
    const firmwarePath = path.join(directory, "firmware", "code.py");
    const pythonTest = `
import ast
import sys
from types import SimpleNamespace

source = open(sys.argv[1], encoding="utf-8").read()
tree = ast.parse(source)
function_names = {"update_indicator", "choose_sensor_address", "flash_fault"}
assignment_names = {"SUPPORTED_SENSOR_ADDRESSES", "ERROR_FLASH_SECONDS"}
selected = []
for node in tree.body:
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in function_names:
        selected.append(node)
    elif isinstance(node, ast.Assign):
        names = {target.id for target in node.targets if isinstance(target, ast.Name)}
        if names & assignment_names:
            selected.append(node)

sleeps = []
namespace = {"time": SimpleNamespace(sleep=lambda delay: sleeps.append(delay))}
exec(compile(ast.Module(body=selected, type_ignores=[]), sys.argv[1], "exec"), namespace)
update = namespace["update_indicator"]
choose = namespace["choose_sensor_address"]
flash = namespace["flash_fault"]

assert update(25.9, True, 28.0, 26.0) is False
assert update(26.0, True, 28.0, 26.0) is False
assert update(27.0, False, 28.0, 26.0) is False
assert update(27.0, True, 28.0, 26.0) is True
assert update(28.0, False, 28.0, 26.0) is True

try:
    update(27.0, False, 26.0, 26.0)
    raise AssertionError("invalid thresholds were accepted")
except ValueError:
    pass

assert choose([0x77]) == 0x77
assert choose([0x76], 0x76) == 0x76
assert choose([0x76, 0x77], 0x77) == 0x77

for addresses, requested, message in [
    ([], None, "not found"),
    ([0x76, 0x77], None, "ambiguous"),
    ([0x77], 0x76, "was not detected"),
]:
    try:
        choose(addresses, requested)
        raise AssertionError("sensor fault was accepted")
    except RuntimeError as error:
        assert message in str(error)

class RecordingLed:
    def __init__(self):
        self.values = []

    @property
    def value(self):
        return self.values[-1] if self.values else None

    @value.setter
    def value(self, new_value):
        self.values.append(new_value)

led = RecordingLed()
flash(led)
assert led.values == [False, True, False]
assert sleeps == [0.2, 0.2]
`;

    const result = spawnSync("python3", ["-c", pythonTest, firmwarePath], {
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
  });
});
