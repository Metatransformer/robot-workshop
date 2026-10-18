import PrintReport from "@/components/print-report";
import { sensorBuildGuide } from "@/lib/sensor-build-guide";

export const metadata = { title: "Buy and assemble the Pico sensor — Metatransformer" };

export default function SensorBuildGuidePage() {
  return <>
    <nav className="appchrome" aria-label="Sensor build actions" style={{padding:"16px 24px",display:"flex",gap:24,flexWrap:"wrap",fontFamily:"system-ui"}}>
      <a href="/?template=sensor">Open the Pico + BME280 starter</a>
      <a href="/bench/sensor">Inspect sensor readings</a>
      <a href="/learn?project=sensor">Learn the supporting theory</a>
    </nav>
    <PrintReport {...sensorBuildGuide} backHref="/" />
  </>;
}
