# video-maker

Kit para hacer **Reels verticales 9:16** a partir de un clip tuyo hablando, con
[HyperFrames](https://github.com/heygen-com/hyperframes) y [Claude Code](https://code.claude.com/docs/en/setup):

```
+------------------------+
|                        |
|   ILUSTRACIÓN animada  |  cambia según lo que dices
|                        |
|------------------------|
|   subtítulos karaoke   |  la palabra que suena se resalta
|------------------------|
|                        |
|        TÚ (clip)       |
|                        |
+------------------------+
        1080 x 1920
```

Tú pones el clip; Claude prepara el video, lo transcribe en tu equipo, diseña las escenas,
renderiza y revisa que cumpla el formato de Instagram (zonas seguras, 1080x1920, 30 fps,
audio a -14 LUFS). Todo corre en local: tus clips no se suben a ningún servicio.

## Requisitos

| Necesitas | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) | 22 o más | HyperFrames y los scripts del kit |
| [FFmpeg](https://ffmpeg.org) | Cualquiera reciente | Preparar el clip y el audio |
| [Git](https://git-scm.com/downloads) | — | Clonar el repo (en Windows, Git Bash también lo usa Claude Code) |
| [Claude Code](https://code.claude.com/docs/en/setup) | — | El asistente que hace los videos. Pide una cuenta Pro, Max, Team, Enterprise o Console |
| Espacio libre | ~2 GB | Modelo de transcripción (640 MB) y navegador de render |

## Instalación paso a paso

### 1. Instala los programas (una vez)

**Windows** (PowerShell):

```powershell
winget install OpenJS.NodeJS.LTS
winget install Gyan.FFmpeg
winget install Git.Git
irm https://claude.ai/install.ps1 | iex
```

**macOS** (con [Homebrew](https://brew.sh)):

```bash
brew install node ffmpeg git
curl -fsSL https://claude.ai/install.sh | bash
```

**Linux** (Debian/Ubuntu): instala Node 22+ desde <https://nodejs.org> y luego:

```bash
sudo apt install ffmpeg git
curl -fsSL https://claude.ai/install.sh | bash
```

Cierra la terminal y abre una nueva. Comprueba:

```bash
node -v          # v22 o más
ffmpeg -version  # imprime la versión
claude --version # imprime la versión
```

### 2. Clona el repo

```bash
git clone https://github.com/FaiberCamachoDev/video-maker.git
cd video-maker
```

### 3. Prepara HyperFrames (una vez)

```bash
npm run setup
```

Hace cinco cosas: comprueba Node y FFmpeg, crea las carpetas, instala las
[skills oficiales de HyperFrames](https://github.com/heygen-com/hyperframes#quick-start) para
tu asistente (`npx hyperframes skills update motion-graphics`), descarga el modelo local de
transcripción Parakeet (cubre español) y corre `hyperframes doctor`. En el diagnóstico, los
✗ de whisper-cpp, TTS y música son opcionales: el kit no los usa.

### 4. Abre Claude Code en la carpeta

```bash
claude
```

Si estaba abierto antes del `setup`, ciérralo y ábrelo de nuevo para que cargue las skills.

## Tu primer video

1. Copia tu clip a `source/` (por ejemplo `source/mi-clip.mp4`). Vale vertical u horizontal;
   lo ideal: celular en vertical, cara bien iluminada y algo de aire sobre la cabeza.
2. En Claude Code escribe:

   ```
   hazme un reel con source/mi-clip.mp4
   ```

3. La primera vez te pregunta los datos de tu marca: usuario de Instagram, colores y fuente.
   Quedan en `brands/<tu-cuenta>.json` para los siguientes videos.
4. Al final tienes `renders/mi-clip.mp4`, ya revisado. Súbelo a Instagram desde el celular.

¿Dudas? Pregúntale a Claude "¿cómo funciona?": el repo trae las instrucciones para que te
responda con los pasos exactos.

## Sin Claude (a mano)

Los mismos pasos que sigue Claude, por si quieres hacerlo tú:

```bash
npm run new -- mi-reel source/mi-clip.mp4 --brand example   # proyecto + transcripción + subtítulos
npm run reframe -- mi-reel --face 540,620                   # centro de tu cara en px del clip
# corrige projects/mi-reel/transcript.json (solo "text") y:
npm run captions -- mi-reel
# escribe las escenas en projects/mi-reel/storyboard.json y:
npm run scenes -- mi-reel
# diseña projects/mi-reel/compositions/scene-*.html (HTML + GSAP)
npm run check -- mi-reel
npm run render -- mi-reel                                   # → renders/mi-reel.mp4
```

`npm run preview -- mi-reel` abre la vista previa de HyperFrames Studio en el navegador.

## Qué hay en el repo

| Ruta | Qué es |
|---|---|
| `CLAUDE.md` | Instrucciones que Claude Code carga al abrir la carpeta |
| `.claude/skills/reels-split/` | El flujo completo para hacer un Reel |
| `.claude/agents/video-qa-reviewer.md` | Revisión técnica del MP4 antes de publicar |
| `.claude/settings.json` | Permite a Claude correr los comandos del kit sin pedir permiso cada vez |
| `docs/instagram-reels.md` | Formato de Instagram: zonas seguras, export, sonoridad |
| `template/` | Plantilla de composición HyperFrames con las zonas fijas |
| `scripts/` | Los comandos `npm run …` (Node, sin dependencias) |
| `brands/` | Formato de marca, una marca de ejemplo y la fuente Inter |

## Privacidad: qué nunca se sube a Git

`source/` (tus clips), `projects/` (tus videos en proceso), `renders/` (los MP4) y tus marcas
están en el `.gitignore`. Solo se versiona el kit.

HyperFrames envía telemetría de uso anónima. Para apagarla:
`npx hyperframes telemetry disable` (o la variable de entorno `HYPERFRAMES_NO_TELEMETRY=1`).

## Actualizar HyperFrames

La versión del CLI está fijada en `package.json` → `config.hyperframes`, para que un proyecto
se renderice igual dentro de un mes. Para subirla: cambia el número, corre
`npm run check -- <proyecto>` y un render de prueba. Las skills se actualizan con
`npx hyperframes skills update`.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `node` o `ffmpeg` "no se reconoce" | Abre una terminal nueva después de instalarlos |
| Claude no conoce `/hyperframes` | `npm run setup` y reinicia Claude Code |
| "Transcripción: FALLÓ" | `npx hyperframes models install parakeet` y `npm run captions -- <proyecto> --transcribe` |
| La cara queda tapada por los subtítulos o cortada | `npm run reframe -- <proyecto> --face X,Y` (mira `projects/<proyecto>/frames/source-50.png`) |
| El render se cae o tarda mucho | Cierra programas y `npm run render -- <proyecto> --workers 1` |
| Video en otro idioma | `--lang en` (u otro código) en `npm run new` |

## Créditos y licencias

- **Este kit:** [MIT](LICENSE).
- **HyperFrames** (CLI y skills): © HeyGen, [Apache-2.0](https://github.com/heygen-com/hyperframes/blob/main/LICENSE).
  No viene en este repo: lo instala `npm run setup` desde su fuente oficial, porque sus skills
  incluyen archivos de terceros (GSAP, efectos de sonido de Pixabay) que no se pueden
  redistribuir.
- **GSAP:** las composiciones lo cargan desde jsDelivr al renderizar, bajo la
  [licencia de GSAP](https://gsap.com/standard-license).
- **Inter** (`brands/fonts/inter/`): © The Inter Project Authors, SIL Open Font License 1.1
  (texto en `brands/fonts/inter/OFL.txt`).
- **Parakeet TDT 0.6B v3** (transcripción): © NVIDIA, CC-BY-4.0; lo descarga el CLI de HyperFrames.
