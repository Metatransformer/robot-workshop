import PrintReport from "@/components/print-report";
import { servoBenchGuide } from "@/lib/servo-bench";

export const metadata = { title: "Buy and assemble the Pico + FS90 servo bench — Metatransformer" };

export default function ServoBuildGuidePage() {
  return <>
    <nav className="appchrome" aria-label="Servo build actions" style={{padding:"16px 24px",display:"flex",gap:24,flexWrap:"wrap",fontFamily:"system-ui"}}>
      <a href="/?template=servo-bench">Open the FS90 bench starter</a>
      <a href="/learn?project=servo-bench">Learn the supporting theory</a>
    </nav>
    <PrintReport {...servoBenchGuide} backHref="/" />
  </>;
}
