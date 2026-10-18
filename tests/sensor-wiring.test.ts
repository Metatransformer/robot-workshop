import { describe, expect, it } from "vitest";
import {
  ENDPOINTS,
  REFERENCE_EDGES,
  WIRING_CASES,
  breadboardConnected,
  inspectSensorWiring,
  type WiringEdge,
} from "../src/lib/sensor-wiring";

describe("Pico and BME280 wiring inspection", () => {
  it("uses the exact four reference pins and pads", () => {
    expect(ENDPOINTS.map(({ id }) => id)).toEqual([
      "pico-gp0",
      "pico-gp1",
      "pico-3v3",
      "pico-gnd",
      "pico-gp2",
      "bme-sda",
      "bme-scl",
      "bme-vin",
      "bme-gnd",
    ]);
    expect(ENDPOINTS.filter(endpoint => endpoint.board === "Pico").map(endpoint => endpoint.label)).toEqual([
      "Physical 1 · GP0", "Physical 2 · GP1", "Physical 36 · 3V3(OUT)", "Physical 38 · GND", "Physical 4 · GP2",
    ]);
    expect(REFERENCE_EDGES).toEqual([
      { from: "pico-gp0", to: "bme-sda" },
      { from: "pico-gp1", to: "bme-scl" },
      { from: "pico-3v3", to: "bme-vin" },
      { from: "pico-gnd", to: "bme-gnd" },
    ]);
  });

  it("reports the expected issues for all four closed cases", () => {
    expect(WIRING_CASES.map(({ id }) => id)).toEqual([
      "correct",
      "swapped-data",
      "missing-ground",
      "wrong-supply",
    ]);
    for (const wiringCase of WIRING_CASES) {
      expect(inspectSensorWiring(wiringCase.edges), wiringCase.id).toEqual(wiringCase.expectedIssues);
    }
  });

  it("models the swapped signals, missing ground, and GPIO supply explicitly", () => {
    expect(WIRING_CASES.find(({ id }) => id === "swapped-data")?.edges).toContainEqual({
      from: "pico-gp0",
      to: "bme-scl",
    });
    expect(WIRING_CASES.find(({ id }) => id === "swapped-data")?.edges).toContainEqual({
      from: "pico-gp1",
      to: "bme-sda",
    });
    expect(WIRING_CASES.find(({ id }) => id === "missing-ground")?.edges).toHaveLength(3);
    expect(WIRING_CASES.find(({ id }) => id === "wrong-supply")?.edges).toContainEqual({
      from: "pico-gp2",
      to: "bme-vin",
    });
  });

  it("ignores edge order and orientation", () => {
    const reversedAndReordered: WiringEdge[] = [
      { from: "bme-gnd", to: "pico-gnd" },
      { from: "bme-vin", to: "pico-3v3" },
      { from: "bme-scl", to: "pico-gp1" },
      { from: "bme-sda", to: "pico-gp0" },
    ];
    expect(inspectSensorWiring(reversedAndReordered)).toEqual([]);
  });

  it("does not accept unexpected or duplicate edges", () => {
    expect(inspectSensorWiring([
      ...REFERENCE_EDGES,
      { from: "pico-gp2", to: "bme-vin" },
    ])).toContain("unexpected-connection");

    expect(inspectSensorWiring([
      ...REFERENCE_EDGES,
      { from: "bme-sda", to: "pico-gp0" },
    ])).toContain("duplicate-connection");
  });

  it("teaches isolated breadboard strips without modeling rails", () => {
    expect(breadboardConnected("a10", "e10")).toBe(true);
    expect(breadboardConnected("a10", "f10")).toBe(false);
    expect(breadboardConnected("a10", "a11")).toBe(false);
    expect(breadboardConnected("a0", "e0")).toBe(false);
    expect(breadboardConnected("a64", "e64")).toBe(false);
    expect(breadboardConnected("+", "a10")).toBe(false);
  });
});
