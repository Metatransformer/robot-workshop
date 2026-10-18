import { headers } from "next/headers";
import HostedDemo from "@/components/hosted-demo";
import Studio from "@/components/studio";
import { sessionToken, verifyLocalEntry } from "@/server/security";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  if (process.env.VERCEL === "1" || process.env.METATRANSFORMER_MODE === "hosted") return <HostedDemo template={(await searchParams).template} />;
  try { verifyLocalEntry(await headers()); }
  catch { return <main style={{ padding: 48, fontFamily: "system-ui" }}><h1>Open your local workshop</h1><p>This workshop is available only at its configured localhost address.</p></main>; }
  return <Studio token={sessionToken()} initialTemplateId={(await searchParams).template} />;
}
