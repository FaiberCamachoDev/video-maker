// npm run new -- <slug> <clip> [--brand <name>] [--lang es] [--face X,Y] [--no-transcribe] [--force]
//
// Creates projects/<slug>/ from template/: stages the clip, applies the brand,
// transcribes, and generates scene slots and captions, so the project renders
// right away and Claude only has to write the storyboard and the scenes.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { ROOT, FPS, die, warn, parseArgs, run, probeMedia, projectDir, writeJson, replaceStyle } from "./lib/common.mjs";
import { resolveBrandName, loadBrand, installFonts, brandCss, fontStack } from "./lib/brand.mjs";
import { buildScenes, buildCaptions, reframe, transcribe } from "./lib/reel.mjs";

const { positional, flags } = parseArgs();
const [slug, clip] = positional;
if (!slug || !clip) die("uso: npm run new -- <nombre-del-proyecto> <ruta-del-clip> [--brand <marca>] [--lang es] [--face X,Y]");

const dir = projectDir(slug);
// npm runs scripts from the repo root; INIT_CWD keeps the folder the user typed the command in.
const clipPath = resolve(process.env.INIT_CWD ?? process.cwd(), clip);
if (!existsSync(clipPath)) die(`no encuentro el clip ${clipPath}`);
const brand = loadBrand(resolveBrandName(flags.brand));
const lang = typeof flags.lang === "string" ? flags.lang : "es";

if (existsSync(dir)) {
  if (!flags.force) die(`projects/${slug} ya existe. Usa otro nombre, o --force para borrarlo y crearlo de cero`);
  warn(`--force: se borra projects/${slug}`);
  rmSync(dir, { recursive: true, force: true });
}

const src = probeMedia(clipPath);
if (!src.hasAudio) warn("el clip no tiene audio: no habrá voz ni subtítulos");
console.log(`Clip: ${src.width}x${src.height} · ${src.fps.toFixed(2)} fps · ${src.duration.toFixed(2)} s`);

for (const sub of ["assets", "compositions", "frames"]) mkdirSync(join(dir, sub), { recursive: true });
const staged = join(dir, "assets", "source.mp4");

// Phones record variable frame rate and sparse keyframes; the renderer seeks
// frame by frame, so the clip is re-encoded at a constant 30 fps with a
// keyframe every second. The short side is capped at 1080 px: the person
// zone is 1080x980, so more pixels only slow the render down.
const scale = src.height >= src.width ? "scale='min(1080,iw)':-2" : "scale=-2:'min(1080,ih)'";
console.log("Preparando el clip (30 fps constantes)...");
run("ffmpeg", [
  "-y", "-v", "error", "-stats",
  "-i", clipPath,
  "-vf", `${scale},fps=${FPS}`,
  "-c:v", "libx264", "-preset", "medium", "-crf", "18",
  "-g", String(FPS), "-keyint_min", String(FPS), "-sc_threshold", "0",
  "-pix_fmt", "yuv420p",
  ...(src.hasAudio ? ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"] : ["-an"]),
  "-movflags", "+faststart",
  staged,
]);

// Whole frames only: a duration past the last frame renders a black tail.
const duration = Number((Math.floor(probeMedia(staged).duration * FPS) / FPS).toFixed(4));

let index = readFileSync(join(ROOT, "template", "index.html"), "utf8")
  .replaceAll("{{DURATION}}", String(duration))
  .replaceAll("{{FONT_STACK}}", fontStack(brand.fonts.body));
index = replaceStyle(index, "brand", brandCss(brand, installFonts(brand, dir)));
writeFileSync(join(dir, "index.html"), index);

writeJson(join(dir, "storyboard.json"), {
  brand: brand.name,
  source: relative(ROOT, clipPath).replaceAll("\\", "/"),
  duration,
  scenes: [
    {
      id: "scene-01",
      start: 0,
      end: duration,
      kicker: brand.handle,
      title: "Escribe aquí la idea principal",
      intent: "Placeholder: replace this scene with the real storyboard",
    },
  ],
});
writeJson(join(dir, "meta.json"), { id: slug, name: slug });
writeJson(join(dir, "hyperframes.json"), {
  $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
  registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
  paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
  media: { autoProxy: true },
});

// Reference frames, so the framing can be checked by looking at real pixels.
for (const pct of [20, 50, 80]) {
  run("ffmpeg", ["-y", "-v", "error", "-ss", ((duration * pct) / 100).toFixed(2), "-i", staged, "-frames:v", "1", join(dir, "frames", `source-${pct}.png`)]);
}

let framing = "centrado (50% 50%)";
if (typeof flags.face === "string") {
  const [x, y] = flags.face.split(",").map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) die("--face espera X,Y en píxeles del clip, ej. --face 540,620");
  const r = reframe(dir, x, y);
  framing = `cara en y=${r.faceCanvasY}${r.inBand ? "" : " (FUERA de 1000-1248: el clip no da para más)"}`;
}

buildScenes(dir);

let transcript = "omitida (--no-transcribe)";
if (src.hasAudio && !flags["no-transcribe"]) {
  console.log(`Transcribiendo (${lang}) en local...`);
  transcript = transcribe(dir, lang) ? "lista" : "FALLÓ";
}
const captions = buildCaptions(dir);

console.log(`
Proyecto listo: projects/${slug}
  Marca:          ${brand.name} (${brand.handle})
  Duración:       ${duration} s
  Encuadre:       ${framing}
  Transcripción:  ${transcript}${captions.words ? ` · ${captions.words} palabras en ${captions.groups} subtítulos` : ""}
`);
if (transcript === "FALLÓ") {
  console.log(`  Para transcribir: npx hyperframes models install parakeet
  y luego:         npm run captions -- ${slug} --transcribe --lang ${lang}
`);
}
console.log(`Siguientes pasos:
  1. Mira projects/${slug}/frames/source-50.png. Si la cara no cae en la franja de la persona:
     npm run reframe -- ${slug} --face X,Y      (centro de la cara, en píxeles del clip)
  2. Corrige projects/${slug}/transcript.json (solo "text") y: npm run captions -- ${slug}
  3. Escribe las escenas en projects/${slug}/storyboard.json y: npm run scenes -- ${slug}
  4. Diseña projects/${slug}/compositions/scene-*.html
  5. npm run check -- ${slug}   y luego   npm run render -- ${slug}
`);
