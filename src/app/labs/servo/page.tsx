import ServoCommandLab from "@/components/servo-command-lab";

export const metadata = {
  title: "Understand the FS90 servo command — Metatransformer",
  description: "Predict and inspect the Pico starter's button, timeout and PWM commands in a bounded behavioral model.",
};

export default function ServoCommandPage() {
  return <ServoCommandLab />;
}
