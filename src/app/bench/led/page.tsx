import LedMeasurementBench from "@/components/led-measurement-bench";

export const metadata = {
  title: "Measure the LED circuit — Metatransformer",
  description: "Record resistor observations separately from nominal estimates, infer current and power, and print a bench record.",
};

export default function LedBenchPage() {
  return <LedMeasurementBench />;
}
