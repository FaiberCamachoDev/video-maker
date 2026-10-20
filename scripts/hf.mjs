// npm run check|snapshot|preview -- <slug> [flags...]
//
// Runs the pinned HyperFrames CLI against projects/<slug>, so every command
// uses the same version as the render.
import { requireProject, hf } from "./lib/common.mjs";

const [command, slug, ...rest] = process.argv.slice(2);
const dir = requireProject(slug);
const res = hf([command, dir, ...rest], { allowFail: true });
process.exit(res.status ?? 1);
