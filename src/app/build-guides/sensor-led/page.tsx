import PrintReport from "@/components/print-report";
import { sensorLedGuide } from "@/lib/sensor-led";

export const metadata = { title: "Build a Pico sensor LED indicator — Metatransformer" };

export default function SensorLedBuildGuidePage() {
  return <>
    <nav className="appchrome" aria-label="Sensor LED build actions" style={{ padding: "16px 24px", display: "flex", gap: 24, flexWrap: "wrap", fontFamily: "system-ui" }}>
      <a href="/?template=sensor-led">Open the external LED starter</a>
      <a href="/learn?project=sensor-led">Learn the supporting theory</a>
      <a href="/learn?lesson=voltage-current-resistance">Review the current calculation</a>
      <a href="/labs/hysteresis">Explore temperature hysteresis</a>
      <a href="/bench/led">Record LED measurements</a>
      <a href="/bench/sensor">Inspect sensor readings</a>
    </nav>
    <PrintReport {...sensorLedGuide} backHref="/build-guides/sensor" />
  </>;
}
