// npm run setup [-- --no-skills] [--no-models]
//
// One-time setup: checks Node and FFmpeg, installs the official HyperFrames
// skills for your coding agents, downloads the local speech model, and runs
// the HyperFrames doctor. Safe to run again.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, HF_VERSION, die, warn, parseArgs, hasCommand, hf } from "./lib/common.mjs";

const { flags } = parseArgs();
const step = (n, text) => console.log(`\n[${n}/5] ${text}`);

step(1, "Node.js");
const major = Number(process.versions.node.split(".")[0]);
if (major < 22) die(`HyperFrames necesita Node.js 22 o superior y tienes ${process.versions.node}. Instálalo desde https://nodejs.org`);
console.log(`  OK  Node ${process.versions.node}`);

step(2, "FFmpeg");
for (const cmd of ["ffmpeg", "ffprobe"]) {
  if (!hasCommand(cmd)) {
    die(
      `no encuentro ${cmd} en el PATH. Instálalo y abre una terminal nueva:\n` +
        "  Windows:  winget install Gyan.FFmpeg\n" +
        "  macOS:    brew install ffmpeg\n" +
        "  Linux:    sudo apt install ffmpeg",
    );
  }
}
console.log("  OK  ffmpeg y ffprobe");
for (const sub of ["source", "projects", "renders"]) mkdirSync(join(ROOT, sub), { recursive: true });

step(3, "Skills de HyperFrames (instalador oficial)");
if (flags["no-skills"]) {
  console.log("  omitido (--no-skills)");
} else {
  // Core set (router + domain skills + media-use) plus the motion-graphics
  // workflow that the reels-split skill uses for the illustrations.
  hf(["skills", "update", "motion-graphics"]);
  console.log("  OK  Reinicia Claude Code para que cargue las skills nuevas.");
}

step(4, "Modelo local de transcripción (Parakeet, cubre español)");
if (flags["no-models"]) {
  console.log("  omitido (--no-models)");
} else if (hf(["models", "install", "parakeet"], { allowFail: true }).status !== 0) {
  warn("no se pudo instalar Parakeet: la transcripción intentará usar Whisper (ver README, Problemas frecuentes)");
}

step(5, `Diagnóstico (hyperframes@${HF_VERSION} doctor)`);
// doctor exits non-zero for optional extras (local TTS, music); only FFmpeg,
// Chrome and Node are required, and those were checked above or install on first render.
hf(["doctor"], { allowFail: true });

console.log(`
Listo. Siguiente paso:
  1. Copia tu clip a source/   (ej. source/mi-clip.mp4)
  2. Abre Claude Code en esta carpeta y escribe:  hazme un reel con source/mi-clip.mp4
`);
