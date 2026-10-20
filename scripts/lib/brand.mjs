// Brand files (brands/<account>.json): validation, fonts and the CSS the
// composition reads. One brand file per account; the pipeline is the same.
import { existsSync, readdirSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, die, readJson, warn } from "./common.mjs";

const HEX = /^#[0-9a-fA-F]{6}$/;
const FONT_FILE = /-(\d{3})(-italic)?\.woff2$/i;
const CASES = ["sentence", "upper", "lower"];

export function listBrands() {
  const dir = join(ROOT, "brands");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Pick the brand: explicit flag, else the only real one, else the example. */
export function resolveBrandName(flag) {
  if (typeof flag === "string") return flag;
  const real = listBrands().filter((b) => b !== "example");
  if (real.length === 1) return real[0];
  if (real.length > 1) die(`hay varias marcas (${real.join(", ")}): indica cuál con --brand <nombre>`);
  warn('no hay marca propia todavía: se usa "example". Crea la tuya en brands/<cuenta>.json (ver brands/README.md)');
  return "example";
}

export function loadBrand(name) {
  const file = join(ROOT, "brands", `${name}.json`);
  if (!existsSync(file)) die(`no existe brands/${name}.json. Marcas disponibles: ${listBrands().join(", ")}`);
  const brand = readJson(file);
  const problems = [];
  if (!brand.handle) problems.push('falta "handle"');
  for (const key of ["bg", "ink", "accent"]) {
    if (!HEX.test(brand.palette?.[key] ?? "")) problems.push(`palette.${key} debe ser un color #RRGGBB`);
  }
  if (brand.palette?.accent2 && !HEX.test(brand.palette.accent2)) problems.push("palette.accent2 debe ser un color #RRGGBB");
  for (const key of ["display", "body"]) {
    if (typeof brand.fonts?.[key] !== "string") problems.push(`fonts.${key} debe ser el nombre de una familia (ej. "Inter")`);
  }
  const cap = brand.captions ?? {};
  // 56 px is the smallest size that keeps a ~40 px cap height (docs/instagram-reels.md).
  if (!(cap.size >= 56 && cap.size <= 96)) problems.push("captions.size debe estar entre 56 y 96 (px)");
  if (!CASES.includes(cap.case)) problems.push(`captions.case debe ser ${CASES.join(" | ")}`);
  if (!HEX.test(brand.palette?.[cap.highlight] ?? "")) problems.push("captions.highlight debe nombrar un color de palette (ej. \"accent\")");
  if (cap.box !== "none" && !HEX.test(brand.palette?.[cap.box] ?? "")) problems.push('captions.box debe nombrar un color de palette o ser "none"');
  if (problems.length) die(`brands/${name}.json no es válido:\n  - ${problems.join("\n  - ")}`);
  for (const key of ["display", "body"]) fontFiles(brand.fonts[key]);
  return { ...brand, name };
}

export function fontSlug(family) {
  return family.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Font files live in brands/fonts/<family-slug>/<Family>-<weight>[-italic].woff2. */
export function fontFiles(family) {
  const dir = join(ROOT, "brands", "fonts", fontSlug(family));
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => FONT_FILE.test(f)) : [];
  if (!files.length) {
    die(
      `no hay archivos de la fuente "${family}" en brands/fonts/${fontSlug(family)}/.\n` +
        `  Descarga la familia (con licencia que permita usarla, p. ej. OFL de Google Fonts o @fontsource) y deja\n` +
        `  cada peso como ${family.replace(/\s+/g, "")}-700.woff2 junto a su licencia.`,
    );
  }
  return files.map((file) => {
    const [, weight, italic] = file.match(FONT_FILE);
    return { file, weight: Number(weight), style: italic ? "italic" : "normal", dir };
  });
}

export function fontStack(family) {
  return `"${family}", ui-sans-serif, system-ui, sans-serif`;
}

/** Copy the brand fonts into the project so the render never needs the network. */
export function installFonts(brand, projectDir) {
  const families = [...new Set([brand.fonts.display, brand.fonts.body])];
  const faces = [];
  for (const family of families) {
    const target = join(projectDir, "fonts", fontSlug(family));
    mkdirSync(target, { recursive: true });
    for (const font of fontFiles(family)) {
      copyFileSync(join(font.dir, font.file), join(target, font.file));
      faces.push(
        `      @font-face { font-family: "${family}"; src: url("fonts/${fontSlug(family)}/${font.file}") format("woff2"); ` +
          `font-weight: ${font.weight}; font-style: ${font.style}; font-display: block; }`,
      );
    }
  }
  return faces;
}

export function captionColors(brand) {
  const p = brand.palette;
  return {
    ink: p.ink,
    highlight: p[brand.captions.highlight],
    box: brand.captions.box === "none" ? null : p[brand.captions.box],
  };
}

export function brandCss(brand, faces) {
  const p = brand.palette;
  const cap = captionColors(brand);
  return [
    `      /* Generated from brands/${brand.name}.json by scripts/new.mjs. Edit the brand file, not this block. */`,
    ...faces,
    "      :root {",
    `        --bg: ${p.bg};`,
    `        --ink: ${p.ink};`,
    `        --accent: ${p.accent};`,
    `        --accent2: ${p.accent2 ?? p.accent};`,
    `        --cap-ink: ${cap.ink};`,
    `        --cap-highlight: ${cap.highlight};`,
    `        --cap-box: ${cap.box ?? "transparent"};`,
    "      }",
  ].join("\n");
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two #RRGGBB colors. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
