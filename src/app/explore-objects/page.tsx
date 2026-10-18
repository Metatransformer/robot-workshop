import ObjectExplorer from "@/components/object-explorer";
export const metadata = { title: "How things work — Metatransformer" };
export default async function ObjectsPage({ searchParams }: { searchParams: Promise<{object?:string}> }) {
  return <ObjectExplorer initialObjectId={(await searchParams).object}/>;
}
