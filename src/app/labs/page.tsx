import SimulationLab from "@/components/simulation-lab";
export const metadata = { title: "Simulation labs — Metatransformer" };
export default async function LabsPage({ searchParams }: { searchParams: Promise<{lab?:string}> }) {
  return <SimulationLab initialLab={(await searchParams).lab}/>;
}
