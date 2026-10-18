import SensorWiringLab from "@/components/sensor-wiring-lab";

export const metadata = {
  title: "Inspect Pico sensor wiring — Metatransformer",
  description: "Practice tracing the exact Pico and BME280 starter connections and choosing unpowered checks.",
};

export default function SensorWiringPage() {
  return <SensorWiringLab />;
}
