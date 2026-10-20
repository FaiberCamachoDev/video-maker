// npm run render -- <slug> [--draft] [--keep-master] [--workers <n>]
//
// 1. Renders projects/<slug> with the pinned CLI (fails on lint errors).
// 2. Normalizes loudness to the target in docs/instagram-reels.md
//    (-14 LUFS integrated, true peak <= -1 dBTP) with a two-pass loudnorm.
//    The video stream is copied untouched; audio becomes AAC 48 kHz stereo.
// 3. Prints the technical numbers of the final file.
import { mkdirSync, rmSync, renameSync } from "node:fs";
import { join } from "node:path";
import { ROOT, FPS, parseArgs, requireProject, hf, run, probeMedia, warn } from "./lib/common.mjs";

const { positional, flags } = parseArgs();
const slug = positional[0];
const dir = requireProject(slug);
const outDir = join(ROOT, "renders");
mkdirSync(outDir, { recursive: true });
const master = join(outDir, `${slug}.master.mp4`);
const out = join(outDir, `${slug}.mp4`);

// Each worker is a Chrome process (~256 MB); --workers 1 helps on machines with little free RAM.
const workers = typeof flags.workers === "string" ? ["--workers", flags.workers] : [];
hf(["render", dir, "-o", master, "--fps", String(FPS), "--quality", flags.draft ? "draft" : "delivery", "--strict", ...workers]);

// -1.5 dBTP instead of -1: AAC encoding adds a few tenths of overshoot.
const TARGET = "I=-14:TP=-1.5:LRA=11";

function loudness(file) {
  const res = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"], {
    capture: true,
  });
  const text = res.stderr;
  return JSON.parse(text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1));
}

const m = probeMedia(master).hasAudio ? loudness(master) : null;
if (!m || !Number.isFinite(Number(m.input_i))) {
  warn("el render no tiene audio (o es silencio): se entrega sin normalizar");
  renameSync(master, out);
} else {
  run("ffmpeg", [
    "-y", "-hide_banner", "-v", "error",
    "-i", master,
    "-af",
    `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:` +
      `measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    out,
  ]);
  if (!flags["keep-master"]) rmSync(master);
}

const probe = (args) => run("ffprobe", ["-v", "error", ...args, "-of", "csv=p=0", out], { capture: true }).stdout.trim();
const video = probe(["-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,pix_fmt,r_frame_rate"]);
const audio = probe(["-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels"]);
const seconds = Number(probe(["-show_entries", "format=duration"]));
const final = m ? loudness(out) : null;

console.log(`
Render: renders/${slug}.mp4
  Video:     ${video}          (esperado: h264,1080,1920,yuv420p,30/1)
  Audio:     ${audio || "sin audio"}                    (esperado: aac,48000,2)
  Duración:  ${seconds.toFixed(2)} s                (Reels: 15-90 s)
  Sonoridad: ${final ? `${final.input_i} LUFS · pico ${final.input_tp} dBTP` : "—"}   (esperado: -14 ±1 LUFS, pico <= -1 dBTP)

Antes de publicar: pídele a Claude la revisión de QA (agente video-qa-reviewer).`);
