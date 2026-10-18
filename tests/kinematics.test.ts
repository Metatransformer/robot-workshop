import { describe, expect, it } from "vitest";
import { solveFourBar } from "../src/lib/kinematics";

const linkage = { ground: 4.8, crank: 1.65, coupler: 4.15, rocker: 3.25 } as const;

describe("solveFourBar", () => {
  it("closes both moving links at a reachable angle", () => {
    const result = solveFourBar(linkage, Math.PI / 3);
    expect(result.valid).toBe(true);
    if (!result.valid) return;

    expect(Math.hypot(result.couplerEnd.x - result.crankEnd.x, result.couplerEnd.y - result.crankEnd.y)).toBeCloseTo(linkage.coupler, 8);
    expect(Math.hypot(result.couplerEnd.x - result.groundB.x, result.couplerEnd.y - result.groundB.y)).toBeCloseTo(linkage.rocker, 8);
    expect(result.closureError).toBeLessThan(1e-8);
  });

  it("returns a warning state instead of invalid geometry when unreachable", () => {
    const result = solveFourBar({ ground: 12, crank: 1, coupler: 2, rocker: 2 }, 0);
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.reason).toMatch(/cannot reach/i);
    expect(Object.values(result.crankEnd).every(Number.isFinite)).toBe(true);
  });

  it("supports both valid assembly branches", () => {
    const open = solveFourBar({ ...linkage, branch: 1 }, 1.1);
    const crossed = solveFourBar({ ...linkage, branch: -1 }, 1.1);
    expect(open.valid && crossed.valid).toBe(true);
    if (!open.valid || !crossed.valid) return;
    expect(open.couplerEnd.x).not.toBeCloseTo(crossed.couplerEnd.x, 6);
    expect(open.couplerEnd.y).not.toBeCloseTo(crossed.couplerEnd.y, 6);
    expect(open.closureError).toBeLessThan(1e-8);
    expect(crossed.closureError).toBeLessThan(1e-8);
  });

  it("keeps the toggle pose finite", () => {
    const result = solveFourBar({ ground: 4, crank: 1, coupler: 2, rocker: 1 }, 0);
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.couplerEnd.y).toBeCloseTo(0, 8);
    expect(Object.values(result.couplerEnd).every(Number.isFinite)).toBe(true);
  });
});
