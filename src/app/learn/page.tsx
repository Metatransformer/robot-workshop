import Academy from "@/components/academy";
export const metadata = { title: "Learn to build — Metatransformer" };
export default async function LearnPage({ searchParams }: { searchParams: Promise<{lesson?:string;project?:string;term?:string}> }) {
  const query = await searchParams;
  return <Academy initialLessonId={query.lesson} initialProject={query.project} initialTermId={query.term}/>;
}
