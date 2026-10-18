#!/usr/bin/env node
import { importSourceBundle } from "./lib/bundle";
import { basename, resolve } from "node:path";
import { checkExportDestination, writeNewExport } from "./server/export-file";
import { scaffoldProject, validateProject, listProjectFiles } from "./lib/project-format";
import { registerProject, exportProject } from "./server/store";

const help = `Metatransformer — ordinary files, extraordinary inventions

  pnpm workshop init <directory> [--template linkage|desk-robot|cyberdeck|sensor|blank] [--title "My invention"]
  pnpm workshop validate <directory>
  pnpm workshop inspect <directory>
  pnpm workshop register <directory>
  pnpm workshop export <directory> <new-output.json>
  pnpm workshop import <bundle.json> <new-directory>

init never overwrites existing files. register makes a project visible in local Studio.
Export contains project source and referenced part definitions, not your global inventory.
Open the project in Codex or Claude Code and start with START_HERE.md, ENGINEERING.md and AGENTS.md.
`;
async function main() {
  const [command, input, ...rest] = process.argv.slice(2);
  if (!command || command === "--help" || command === "help") { console.log(help); return; }
  if (!input) throw new Error("A project directory is required. Run pnpm workshop --help.");
  const directory = resolve(input);
  const option = (name: string) => { const index = rest.indexOf(name); if (index < 0) return undefined; if (!rest[index + 1] || rest[index + 1].startsWith("--")) throw new Error(`Missing value for ${name}`); return rest[index + 1]; };
  switch (command) {
    case "init": {
      const project = await scaffoldProject(directory, { title: option("--title") || basename(directory), templateId: option("--template") || "blank" });
      console.log(`Created ${project.title}\n${directory}\nRead START_HERE.md, then run pnpm workshop register "${directory}" to open in Studio.`); break;
    }
    case "import": {
      const destination = rest[0];
      if (!destination || destination.startsWith("--")) throw new Error("Provide a new destination directory.");
      const project = await importSourceBundle(directory, resolve(destination));
      console.log(`Imported ${project.title}\n${resolve(destination)}\nRegister this directory to open it in Studio.`); break;
    }
    case "validate": {
      const result = await validateProject(directory); console.log(JSON.stringify(result, null, 2)); if (!result.valid) process.exitCode = 1; break;
    }
    case "inspect": {
      const result = await validateProject(directory); if (!result.valid) throw new Error(result.issues.join("\n"));
      console.log(JSON.stringify({ project: result.project, files: await listProjectFiles(directory) }, null, 2)); break;
    }
    case "register": {
      const project = await registerProject(directory); console.log(`Registered ${project.title}\n${project.directory}`); break;
    }
    case "export": {
      const output = rest[0]; if (!output || output.startsWith("--")) throw new Error("Provide a new output filename.");
      const destination = await checkExportDestination(directory, output);
      const project = await registerProject(directory);
      const bundle = await exportProject(project.id);
      await writeNewExport(destination, bundle.content);
      console.log(`Exported ${project.title}\n${destination}`); break;
    }
    default: throw new Error(`Unknown command: ${command}\n${help}`);
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
