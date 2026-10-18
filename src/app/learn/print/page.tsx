import { notFound } from "next/navigation";
import PrintReport from "@/components/print-report";
import { getModule } from "@/lib/curriculum";
import { buildLessonReport } from "@/lib/build-report";
export default async function LessonPrintPage({ searchParams }: { searchParams: Promise<{lesson?:string}> }) {
  const lesson = getModule((await searchParams).lesson ?? "");
  if (!lesson) notFound();
  return <PrintReport {...buildLessonReport(lesson)} backHref={`/learn?lesson=${lesson.id}`}/>;
}
