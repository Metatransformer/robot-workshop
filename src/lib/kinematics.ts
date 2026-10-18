export type Point2 = { x: number; y: number };

export type FourBarParameters = {
  ground: number;
  crank: number;
  coupler: number;
  rocker: number;
  branch?: 1 | -1;
};

export type FourBarSolution = {
  valid: true;
  groundA: Point2;
  groundB: Point2;
  crankEnd: Point2;
  couplerEnd: Point2;
  closureError: number;
  angle: number;
} | {
  valid: false;
  groundA: Point2;
  groundB: Point2;
  crankEnd: Point2;
  reason: string;
  angle: number;
};

const EPSILON = 1e-8;

/**
 * Solves a planar four-bar linkage by intersecting the coupler and rocker
 * circles. Lengths are arbitrary but must share the same unit.
 */
export function solveFourBar(parameters: FourBarParameters, angle: number): FourBarSolution {
  const { ground, crank, coupler, rocker } = parameters;
  const groundA = { x: 0, y: 0 };
  const groundB = { x: ground, y: 0 };
  const crankEnd = { x: crank * Math.cos(angle), y: crank * Math.sin(angle) };

  if (![ground, crank, coupler, rocker, angle].every(Number.isFinite)) {
    return { valid: false, groundA, groundB, crankEnd, reason: "Linkage values must be finite numbers.", angle };
  }
  if ([ground, crank, coupler, rocker].some((length) => length <= 0)) {
    return { valid: false, groundA, groundB, crankEnd, reason: "Link lengths must be greater than zero.", angle };
  }

  const dx = groundB.x - crankEnd.x;
  const dy = groundB.y - crankEnd.y;
  const distance = Math.hypot(dx, dy);
  if (distance > coupler + rocker + EPSILON) {
    return { valid: false, groundA, groundB, crankEnd, reason: "Coupler and rocker cannot reach each other at this crank angle.", angle };
  }
  if (distance < Math.abs(coupler - rocker) - EPSILON) {
    return { valid: false, groundA, groundB, crankEnd, reason: "One moving link sits entirely inside the other link's reach.", angle };
  }
  if (distance < EPSILON) {
    return { valid: false, groundA, groundB, crankEnd, reason: "The circle centers coincide, so the linkage has no unique pose.", angle };
  }

  const along = (coupler * coupler - rocker * rocker + distance * distance) / (2 * distance);
  const heightSquared = Math.max(0, coupler * coupler - along * along);
  const height = Math.sqrt(heightSquared);
  const ux = dx / distance;
  const uy = dy / distance;
  const midpoint = { x: crankEnd.x + along * ux, y: crankEnd.y + along * uy };
  const branch = parameters.branch === -1 ? -1 : 1;
  const couplerEnd = {
    x: midpoint.x + branch * -uy * height,
    y: midpoint.y + branch * ux * height,
  };
  const closureError = Math.max(
    Math.abs(Math.hypot(couplerEnd.x - crankEnd.x, couplerEnd.y - crankEnd.y) - coupler),
    Math.abs(Math.hypot(couplerEnd.x - groundB.x, couplerEnd.y - groundB.y) - rocker),
  );

  return { valid: true, groundA, groundB, crankEnd, couplerEnd, closureError, angle };
}

export function fourBarFromRecord(parameters: Record<string, number>): FourBarParameters {
  return {
    ground: parameters.ground ?? parameters.base ?? 4.8,
    crank: parameters.crank ?? 1.65,
    coupler: parameters.coupler ?? 4.15,
    rocker: parameters.rocker ?? 3.25,
    branch: parameters.branch === -1 ? -1 : 1,
  };
}
