// npm run captions -- <slug> [--transcribe] [--lang es]
//
// Regenerates compositions/captions.html from transcript.json and the brand.
// --transcribe runs the local transcription again first (it overwrites
// transcript.json, including any corrections).
import { parseArgs, requireProject, die, warn } from "./lib/common.mjs";
import { buildCaptions, transcribe } from "./lib/reel.mjs";

const { positional, flags } = parseArgs();
const dir = requireProject(positional[0]);
const lang = typeof flags.lang === "string" ? flags.lang : "es";

if (flags.transcribe && !transcribe(dir, lang)) {
  die("la transcripción falló. Instala el modelo local con: npx hyperframes models install parakeet");
}
const { groups, words } = buildCaptions(dir);
if (!words) warn("transcript.json está vacío o no existe: los subtítulos quedan vacíos");
console.log(`Subtítulos: ${words} palabras en ${groups} grupos → compositions/captions.html`);
