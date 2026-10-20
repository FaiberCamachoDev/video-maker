// Shared helpers for the video-maker scripts. Node 22+, no dependencies.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

// One pinned CLI version for every command, so a project renders the same
// way next month. Bump it in package.json ("config.hyperframes").
export const HF_VERSION = PKG.config.hyperframes;
export const FPS = 30;

// reels-split layout on the 1080x1920 canvas. The numbers come from
// docs/instagram-reels.md; change them there first, then here.
export const LAYOUT = {
  canvas: { w: 1080, h: 1920 },
  illus: { x: 0, y: 0, w: 1080, h: 940 },
  textSafe: { x0: 65, x1: 1015, y0: 270, y1: 860 },
  captions: { x: 0, y: 860, w: 1080, h: 140 },
  video: { x: 0, y: 940, w: 1080, h: 980 },
  face: { y0: 1000, y1: 1248 },
};

export function die(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

export function warn(message) {
  console.warn(`AVISO: ${message}`);
}

/** Positional args plus `--flag value` / `--flag` (boolean). */
export function parseArgs(argv = process.argv.slice(2)) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

// On Windows `npx`/`npm` are .cmd shims: Node only spawns them through a
// shell, and the shell does not quote anything, so the command line is built
// here with paths that contain spaces (C:\Users\Jane Doe\...) quoted.
function quoteForCmd(arg) {
  return /[\s&|<>^()%!"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

/**
 * Run a command. Output streams to the terminal unless `capture` is set.
 * Exits the script on failure unless `allowFail` is set.
 */
export function run(cmd, args, { capture = false, cwd = ROOT, allowFail = false } = {}) {
  const viaShell = process.platform === "win32" && (cmd === "npx" || cmd === "npm");
  const options = {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    maxBuffer: 256 * 1024 * 1024,
  };
  const res = viaShell
    ? spawnSync([cmd, ...args].map(quoteForCmd).join(" "), { ...options, shell: true })
    : spawnSync(cmd, args, options);
  if (res.error) {
    if (allowFail) return res;
    die(`no se pudo ejecutar "${cmd}": ${res.error.message}`);
  }
  if (res.status !== 0 && !allowFail) {
    const tail = capture ? `\n${(res.stderr || "").trim().split("\n").slice(-15).join("\n")}` : "";
    die(`"${cmd} ${args.join(" ")}" terminó con código ${res.status}${tail}`);
  }
  return res;
}

/** The pinned HyperFrames CLI. */
export function hf(args, options) {
  return run("npx", ["--yes", `hyperframes@${HF_VERSION}`, ...args], options);
}

export function hasCommand(cmd) {
  const res = spawnSync(cmd, ["-version"], { stdio: "ignore" });
  return !res.error && res.status === 0;
}

/** Width, height, fps, duration and audio presence of a media file. */
export function probeMedia(file) {
  const res = run(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", file],
    { capture: true },
  );
  const data = JSON.parse(res.stdout);
  const video = data.streams.find((s) => s.codec_type === "video");
  if (!video) die(`${file} no tiene pista de video`);
  const [num, den] = String(video.r_frame_rate || "0/1").split("/").map(Number);
  return {
    width: video.width,
    height: video.height,
    fps: den ? num / den : 0,
    duration: Number(data.format.duration),
    hasAudio: data.streams.some((s) => s.codec_type === "audio"),
  };
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function projectDir(slug) {
  if (!slug || !SLUG.test(slug)) die(`nombre de proyecto inválido "${slug ?? ""}": usa minúsculas, números y guiones (ej. mi-primer-reel)`);
  return join(ROOT, "projects", slug);
}

export function requireProject(slug) {
  const dir = projectDir(slug);
  if (!existsSync(join(dir, "index.html"))) die(`no existe projects/${slug}. Créalo con: npm run new -- ${slug} source/<clip>.mp4`);
  return dir;
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

/** Snap a time to the frame grid so nothing lands between two frames. */
export function quantize(t) {
  return Math.round(t * FPS) / FPS;
}

export function fixed(t) {
  return Number(quantize(t).toFixed(4));
}

/** Replace what sits between two marker comments, keeping the markers. */
export function replaceBetween(html, startMarker, endMarker, content) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) die(`no encuentro los marcadores ${startMarker} / ${endMarker} en index.html`);
  return html.slice(0, start + startMarker.length) + content + html.slice(end);
}

/** Replace the body of <style id="..."> without touching the rest of the file. */
export function replaceStyle(html, id, css) {
  const re = new RegExp(`(<style id="${id}">)[\\s\\S]*?(</style>)`);
  if (!re.test(html)) die(`no encuentro <style id="${id}"> en index.html`);
  return html.replace(re, `$1\n${css}\n    $2`);
}

export function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
