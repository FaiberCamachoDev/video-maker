// npm run scenes -- <slug> [--reset scene-01,scene-02]
//
// Reads projects/<slug>/storyboard.json, rewrites the scene slots in index.html
// and creates compositions/<scene-id>.html for scenes that do not have one yet.
// Existing scene files are kept; --reset scaffolds the listed ones again
// (their current design is lost).
import { parseArgs, requireProject, die } from "./lib/common.mjs";
import { buildScenes } from "./lib/reel.mjs";

const { positional, flags } = parseArgs();
const dir = requireProject(positional[0]);
if (flags.reset === true) die("--reset necesita ids separados por comas, ej. --reset scene-01,scene-03");
const reset = typeof flags.reset === "string" ? flags.reset.split(",").map((s) => s.trim()) : [];
const { scenes, created } = buildScenes(dir, reset);

for (const s of scenes) {
  const mark = created.includes(s.id) ? "nueva " : "      ";
  console.log(`${mark} ${s.id.padEnd(16)} ${String(s.start).padStart(7)}s → ${String(s.end).padStart(7)}s  ${s.intent ?? ""}`);
}
console.log(`\n${scenes.length} escenas en index.html${created.length ? `; plantilla creada para: ${created.join(", ")}` : ""}.`);
