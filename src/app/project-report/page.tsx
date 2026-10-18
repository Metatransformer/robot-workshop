import { headers } from "next/headers";
import PrintReport from "@/components/print-report";
import { buildProjectReport } from "@/lib/build-report";
import { getProject, exportProject } from "@/server/store";
import { verifyLocalEntry } from "@/server/security";

export const dynamic = "force-dynamic";
export const metadata = { title: "Build packet — Metatransformer" };
export default async function ProjectReportPage({ searchParams }: { searchParams: Promise<{id?:string;file?:string|string[];preview?:string}> }) {
  try { verifyLocalEntry(await headers()); }
  catch { return <main><h1>Open your local workshop to create a build packet</h1><a href="/">Workshop</a></main>; }
  const query = await searchParams;
  if (!query.id) return <main><h1>Choose a project in the workshop first</h1><a href="/">Workshop</a></main>;
  try {
    const project = await getProject(query.id);
    if (query.preview === "1") {
      const paths = query.file ? Array.isArray(query.file) ? query.file : [query.file] : [];
      // Reuse source export's allowlist, sensitive-path checks and stable snapshot.
      const exported = JSON.parse((await exportProject(project.id, paths)).content) as {
        project: typeof project;
        files: {path:string;content:string;kind:string}[];
      };
      const documents = exported.files.filter(file => ["document", "code", "data"].includes(file.kind)).map(file => ({
        path: file.path, content: Buffer.from(file.content, "base64").toString("utf8"),
      }));
      const report = buildProjectReport({ ...project, ...exported.project }, documents);
      return <PrintReport {...report} backHref={`/project-report?id=${encodeURIComponent(project.id)}`}/>;
    }
    const files = project.files.filter(file => ["document", "code", "data"].includes(file.kind) && file.path !== "project.json");
    return <main style={{maxWidth:800,margin:"40px auto",padding:24,fontFamily:"system-ui",lineHeight:1.6}}>
      <a href="/">← Workshop</a><h1>Make a build packet</h1><h2>{project.title}</h2>
      <p>Select the documents and code to share. The preview includes a parts list and blank test record. Review the preview before printing or saving a PDF.</p>
      <p>Only selected files are included. Check them for private notes or credentials; file contents are not automatically redacted.</p>
      <form method="get"><input type="hidden" name="id" value={project.id}/><input type="hidden" name="preview" value="1"/>
        <fieldset><legend>Include project files</legend>{files.map(file => <label key={file.path} style={{display:"block",padding:"8px 0",overflowWrap:"anywhere"}}>
          <input type="checkbox" name="file" value={file.path} defaultChecked={["README.md","ENGINEERING.md","WIRING.md","START_HERE.md"].includes(file.path)}/>{" "}{file.path}
        </label>)}</fieldset><button type="submit" style={{marginTop:20,padding:"12px 20px"}}>Preview build packet</button>
      </form></main>;
  } catch {
    return <main style={{padding:40,fontFamily:"system-ui"}}><h1>Could not create this packet</h1><p>The project or selected files may be unavailable, or the selection contains a protected file. Return to the workshop and choose the project again.</p><a href="/">Workshop</a></main>;
  }
}
