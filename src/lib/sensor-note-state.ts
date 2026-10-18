export type SensorNotesBySegment = Readonly<Record<string, string>>;

export function changedSensorNoteSegmentIds(
  current: SensorNotesBySegment,
  baseline: SensorNotesBySegment = {},
): string[] {
  return [...new Set([...Object.keys(baseline), ...Object.keys(current)])]
    .filter((segmentId) => (current[segmentId] ?? "") !== (baseline[segmentId] ?? ""))
    .sort();
}
