export const ENDPOINTS = [
  { id: "pico-gp0", board: "Pico", label: "Physical 1 · GP0" },
  { id: "pico-gp1", board: "Pico", label: "Physical 2 · GP1" },
  { id: "pico-3v3", board: "Pico", label: "Physical 36 · 3V3(OUT)" },
  { id: "pico-gnd", board: "Pico", label: "Physical 38 · GND" },
  { id: "pico-gp2", board: "Pico", label: "Physical 4 · GP2" },
  { id: "bme-sda", board: "BME280", label: "SDI / SDA" },
  { id: "bme-scl", board: "BME280", label: "SCK / SCL" },
  { id: "bme-vin", board: "BME280", label: "VIN" },
  { id: "bme-gnd", board: "BME280", label: "GND" },
] as const;

export type EndpointId = (typeof ENDPOINTS)[number]["id"];

export type WiringEdge = Readonly<{
  from: EndpointId;
  to: EndpointId;
}>;

export const REFERENCE_EDGES = [
  { from: "pico-gp0", to: "bme-sda" },
  { from: "pico-gp1", to: "bme-scl" },
  { from: "pico-3v3", to: "bme-vin" },
  { from: "pico-gnd", to: "bme-gnd" },
] as const satisfies readonly WiringEdge[];

export const WIRING_ISSUE_CODES = [
  "missing-gp0-sda",
  "missing-gp1-scl",
  "missing-3v3-vin",
  "missing-gnd-gnd",
  "unexpected-connection",
  "duplicate-connection",
] as const;

export type WiringIssueCode = (typeof WIRING_ISSUE_CODES)[number];

const missingIssueByReference = new Map<string, WiringIssueCode>([
  [edgeKey("pico-gp0", "bme-sda"), "missing-gp0-sda"],
  [edgeKey("pico-gp1", "bme-scl"), "missing-gp1-scl"],
  [edgeKey("pico-3v3", "bme-vin"), "missing-3v3-vin"],
  [edgeKey("pico-gnd", "bme-gnd"), "missing-gnd-gnd"],
]);

function edgeKey(first: EndpointId, second: EndpointId): string {
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

/**
 * Compares a small netlist with this lesson's four reference connections.
 * It does not validate an arbitrary circuit or establish that hardware may be powered.
 */
export function inspectSensorWiring(edges: readonly WiringEdge[]): WiringIssueCode[] {
  const referenceKeys = new Set(REFERENCE_EDGES.map(({ from, to }) => edgeKey(from, to)));
  const observedKeys = new Set<string>();
  const issues: WiringIssueCode[] = [];

  for (const { from, to } of edges) {
    const key = edgeKey(from, to);
    if (observedKeys.has(key)) {
      if (!issues.includes("duplicate-connection")) issues.push("duplicate-connection");
      continue;
    }
    observedKeys.add(key);
    if (!referenceKeys.has(key) && !issues.includes("unexpected-connection")) {
      issues.push("unexpected-connection");
    }
  }

  for (const { from, to } of REFERENCE_EDGES) {
    const key = edgeKey(from, to);
    if (!observedKeys.has(key)) issues.push(missingIssueByReference.get(key)!);
  }

  return issues;
}

export const FAULT_OPTIONS = [
  { id: "correct", label: "The four reference connections match" },
  { id: "swapped-data", label: "SDA and SCL are exchanged" },
  { id: "missing-ground", label: "The ground connection is missing" },
  { id: "wrong-supply", label: "A GPIO is being used as the power connection" },
] as const;

export type WiringFaultId = (typeof FAULT_OPTIONS)[number]["id"];

export const CHECK_OPTIONS = [
  { id: "trace-all", label: "Disconnect USB/external power, then trace all four reference paths" },
  { id: "trace-signals", label: "Disconnect USB/external power, then trace SDA and SCL by label" },
  { id: "trace-ground", label: "Disconnect USB/external power, then continuity-check the ground path" },
  { id: "trace-supply", label: "Disconnect USB/external power, then trace 3V3(OUT) to VIN" },
  { id: "power-and-see", label: "Wrong method: power it and see whether the sensor responds" },
] as const;

export type WiringCheckId = (typeof CHECK_OPTIONS)[number]["id"];

export type WiringCase = Readonly<{
  id: WiringFaultId;
  title: string;
  edges: readonly WiringEdge[];
  expectedFault: WiringFaultId;
  explanation: string;
  expectedCheckId: Exclude<WiringCheckId, "power-and-see">;
  checkExplanation: string;
  expectedIssues: readonly WiringIssueCode[];
}>;

export const WIRING_CASES = [
  {
    id: "correct",
    title: "Board A",
    edges: REFERENCE_EDGES,
    expectedFault: "correct",
    explanation: "The displayed netlist contains GP0 to SDI/SDA, GP1 to SCK/SCL, 3V3(OUT) to VIN, and GND to GND. That only matches this lesson's four reference connections; it is not approval to apply power.",
    expectedCheckId: "trace-all",
    checkExplanation: "With USB and every external power source disconnected, trace all four paths against the reference before doing any other bench work.",
    expectedIssues: [],
  },
  {
    id: "swapped-data",
    title: "Board B",
    edges: [
      { from: "pico-gp0", to: "bme-scl" },
      { from: "pico-gp1", to: "bme-sda" },
      { from: "pico-3v3", to: "bme-vin" },
      { from: "pico-gnd", to: "bme-gnd" },
    ],
    expectedFault: "swapped-data",
    explanation: "The two signal destinations are exchanged: GP0 reaches SCK/SCL while GP1 reaches SDI/SDA. This may prevent communication, but this diagram does not predict a guaranteed error.",
    expectedCheckId: "trace-signals",
    checkExplanation: "Disconnect USB and external power, then follow the two signal paths by endpoint label: GP0 to SDI/SDA and GP1 to SCK/SCL.",
    expectedIssues: ["unexpected-connection", "missing-gp0-sda", "missing-gp1-scl"],
  },
  {
    id: "missing-ground",
    title: "Board C",
    edges: [
      { from: "pico-gp0", to: "bme-sda" },
      { from: "pico-gp1", to: "bme-scl" },
      { from: "pico-3v3", to: "bme-vin" },
    ],
    expectedFault: "missing-ground",
    explanation: "There is no edge from Pico physical pin 38 GND to the sensor GND pad. A missing reference path may prevent communication; the picture cannot predict a particular voltage or symptom.",
    expectedCheckId: "trace-ground",
    checkExplanation: "Disconnect USB and external power before using continuity mode to trace physical pin 38 GND to the sensor GND path.",
    expectedIssues: ["missing-gnd-gnd"],
  },
  {
    id: "wrong-supply",
    title: "Board D",
    edges: [
      { from: "pico-gp0", to: "bme-sda" },
      { from: "pico-gp1", to: "bme-scl" },
      { from: "pico-gp2", to: "bme-vin" },
      { from: "pico-gnd", to: "bme-gnd" },
    ],
    expectedFault: "wrong-supply",
    explanation: "VIN is connected to GP2, a GPIO, instead of the designated 3V3(OUT) supply pin. This inspection does not predict damage or a specific voltage.",
    expectedCheckId: "trace-supply",
    checkExplanation: "Disconnect USB and external power, then trace the supply by printed labels: physical pin 36 3V3(OUT) must reach sensor VIN. Sensor 3Vo is a regulator output and is not this connection.",
    expectedIssues: ["unexpected-connection", "missing-3v3-vin"],
  },
] as const satisfies readonly WiringCase[];

type BreadboardContact = Readonly<{
  column: string;
  row: number;
  group: "a-e" | "f-j";
}>;

function parseBreadboardContact(value: string): BreadboardContact | null {
  const match = /^([a-j])(\d{1,2})$/i.exec(value.trim());
  if (!match) return null;
  const column = match[1]!.toLowerCase();
  const row = Number(match[2]);
  if (!Number.isInteger(row) || row < 1 || row > 63) return null;
  return { column, row, group: column <= "e" ? "a-e" : "f-j" };
}

/** Checks only the two isolated five-contact terminal strips; power rails are out of scope. */
export function breadboardConnected(first: string, second: string): boolean {
  const left = parseBreadboardContact(first);
  const right = parseBreadboardContact(second);
  return Boolean(left && right && left.row === right.row && left.group === right.group);
}
