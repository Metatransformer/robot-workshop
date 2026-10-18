import SensorHysteresisLab from "@/components/sensor-hysteresis-lab";

export const metadata = {
  title: "Why the LED remembers — Metatransformer",
  description: "Predict and inspect the Pico sensor starter's temperature hysteresis, fault and restart commands.",
};

export default function HysteresisPage() {
  return <SensorHysteresisLab />;
}
