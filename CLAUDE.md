# video-maker

Kit para hacer Reels verticales 9:16 (1080x1920) con [HyperFrames](https://github.com/heygen-com/hyperframes):
una ilustración animada arriba que cambia según lo que se dice, la persona hablando abajo y
subtítulos karaoke en la franja media, con la marca de cada cuenta (`brands/<cuenta>.json`).

## Si el usuario pregunta "¿cómo funciona?" o "¿qué tengo que hacer?"

Responde con estos pasos, en este orden, y ofrécete a hacer tú los que se puedan hacer desde
la terminal:

1. **Una sola vez:** tener Node.js 22+, FFmpeg y Git (compruébalo con `node -v` y
   `ffmpeg -version`) y correr `npm run setup`, que instala las skills oficiales de HyperFrames
   y el modelo local de transcripción. Después, **reiniciar Claude Code** para que cargue las
   skills nuevas.
2. **Copiar el clip** (la persona hablando; vertical u horizontal) a la carpeta `source/`.
3. **Pedir el video:** "hazme un reel con source/<clip>". La primera vez se preguntan los datos
   de la marca (usuario, colores, fuente).
4. **Recoger el resultado** en `renders/<nombre>.mp4` y subirlo a mano a Instagram.

Todo lo demás (preparar el clip, transcribir, encuadrar la cara, subtítulos, escenas, render,
sonoridad y revisión técnica) lo haces tú con la skill `reels-split`.

Si falta un requisito, da el comando exacto para su sistema: Windows `winget install OpenJS.NodeJS.LTS`
y `winget install Gyan.FFmpeg`; macOS `brew install node ffmpeg`; Linux (Debian/Ubuntu)
`sudo apt install ffmpeg` y Node 22+ desde <https://nodejs.org>. Después, terminal nueva.

## Para hacer un video

Sigue la skill `reels-split` (`.claude/skills/reels-split/SKILL.md`): es el flujo completo,
paso a paso. Al final, el agente `video-qa-reviewer` revisa el MP4; ningún video se entrega
sin que devuelva **LISTO**.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run setup` | Una vez: comprueba Node y FFmpeg, instala skills y modelo, corre `hyperframes doctor` |
| `npm run new -- <slug> source/<clip> [--brand <cuenta>] [--lang es]` | Crea `projects/<slug>/`: clip a 30 fps, marca, transcripción, subtítulos y una escena inicial |
| `npm run reframe -- <slug> --face X,Y` | Encuadra: pone la cara (centro, en px del clip) en la franja visible |
| `npm run captions -- <slug> [--transcribe]` | Regenera los subtítulos desde `transcript.json` |
| `npm run scenes -- <slug> [--reset <ids>]` | Crea los slots de escena desde `storyboard.json` |
| `npm run check -- <slug>` | Lint, layout, movimiento y contraste de la composición |
| `npm run snapshot -- <slug> --at 2,6,10` | Fotogramas sueltos y una hoja de contacto para revisar |
| `npm run preview -- <slug>` | Vista previa en el navegador (HyperFrames Studio) |
| `npm run render -- <slug> [--draft] [--workers 1]` | Render a `renders/<slug>.mp4` con audio a -14 LUFS |

## Mapa del repo

| Ruta | Qué hay | En Git |
|---|---|---|
| `.claude/skills/reels-split/` | El flujo de trabajo | Sí |
| `.claude/agents/video-qa-reviewer.md` | El gate de QA técnico del MP4 | Sí |
| `docs/instagram-reels.md` | Números de la plataforma: zonas seguras, export, sonoridad | Sí |
| `template/` | Plantilla de composición HyperFrames (zonas fijas), escena base y `examples/` | Sí |
| `scripts/` | Los comandos de arriba (Node, sin dependencias) | Sí |
| `brands/` | `example.json`, el formato (`README.md`) y la fuente Inter | Solo eso |
| `source/` | Clips originales | No |
| `projects/<slug>/` | Un proyecto por video: composición, transcript, storyboard | No |
| `renders/` | MP4 finales | No |

## Reglas

- Las zonas del layout no se mueven (ver la skill y `docs/instagram-reels.md`).
- No edites a mano lo que generan los scripts: `<style id="brand">`, `<style id="talent">`, el
  bloque `SCENES` de `index.html` y `compositions/captions.html`. Cambia su fuente y vuelve a
  correr el comando.
- `source/`, `renders/`, `projects/` y las marcas propias son personales: no se suben a Git.
- Ninguna clave de API en archivos del repo; si un flujo la pide, va en una variable de entorno.
- La versión del CLI de HyperFrames está fijada en `package.json` → `config.hyperframes`; los
  scripts la usan siempre. No la subas sin volver a pasar `check` y `render`.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Claude no tiene las skills `/hyperframes…` | `npm run setup` y reiniciar Claude Code |
| "Transcripción: FALLÓ" | `npx hyperframes models install parakeet` y `npm run captions -- <slug> --transcribe` |
| La cara sale cortada o tapada | Mira `projects/<slug>/frames/source-50.png` y `npm run reframe -- <slug> --face X,Y` |
| El render se cae o va muy lento | Cierra programas y `npm run render -- <slug> --workers 1` |
| El video no es en español | `--lang en` (u otro código) en `new` y en `captions --transcribe` |
| `doctor` marca ✗ en whisper-cpp, TTS o música | Son opcionales; el kit no los necesita |
