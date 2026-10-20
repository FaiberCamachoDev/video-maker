// npm run reframe -- <slug> --face X,Y
//
// X,Y: center of the face in pixels of projects/<slug>/frames/source-50.png
// (same size as assets/source.mp4). Moves the video inside the person zone so
// the face lands in the visible band (y 1000-1248); the zones never move.
import { parseArgs, requireProject, die, warn } from "./lib/common.mjs";
import { reframe } from "./lib/reel.mjs";

const { positional, flags } = parseArgs();
const dir = requireProject(positional[0]);
const [x, y] = String(flags.face ?? "").split(",").map(Number);
if (!Number.isFinite(x) || !Number.isFinite(y)) die("uso: npm run reframe -- <proyecto> --face X,Y   (ej. --face 540,620)");

const r = reframe(dir, x, y);
console.log(`object-position: ${r.posX.toFixed(2)}% ${r.posY.toFixed(2)}% · cara en y=${r.faceCanvasY} del lienzo`);
if (!r.inBand) warn("el clip no permite subir/bajar más: la cara queda fuera de y 1000-1248. Vuelve a grabar con más aire arriba o abajo");
