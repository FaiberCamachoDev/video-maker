---
name: reels-split
description: Hace Reels verticales 9:16 (1080x1920) con este repo — ilustración HyperFrames arriba que cambia según lo que se dice, la persona hablando abajo y subtítulos karaoke en la franja media, con la marca de brands/<cuenta>.json. Úsala cuando el usuario pida un reel, short, tiktok o video vertical a partir de un clip suyo hablando (normalmente en source/), o quiera crear o cambiar una marca, re-encuadrar la cara, corregir subtítulos, rehacer escenas o volver a renderizar un proyecto de projects/. No es para videos sin persona ni para formatos horizontales.
---

# reels-split

Formato fijo: **ilustración arriba, persona abajo, subtítulos en la costura**. Los scripts
de `scripts/` hacen todo lo que se puede calcular (preparar el clip, transcribir, encuadrar,
subtítulos, slots de escenas, render, sonoridad). Tú escribes solo lo creativo: el
storyboard y el diseño de cada escena.

Números de plataforma (zonas, export, sonoridad): `docs/instagram-reels.md`. Léelo antes de
empezar un video; si su fecha tiene más de 6 meses, avisa de que conviene revisarlo.

## Layout (1080x1920) — las zonas no se mueven

```
y=0     +------------------------------+
        |  margen UI (sin texto)  270  |  <- usuario y audio de Reels
        |  ILUSTRACION (escenas)       |  texto solo en y 270-860, x 65-1015
y=860   |------------------------------|
        |  SUBTITULOS (franja media)   |  y 860-1000, 1 línea, caja de la marca
y=940   |------------------------------|  <- empieza el video de la persona
        |  PERSONA (assets/source.mp4) |  cara entre y 1000 y 1248
y=1248  |  ..........................  |  <- desde aquí la UI de Reels tapa
        |  hombros / torso             |
y=1920  +------------------------------+
```

Columna de botones de Reels: `x > 960` desde `y 1100`; ahí nunca va texto.

## Antes de nada

- Las skills de HyperFrames (`/hyperframes`, `/hyperframes-core`, `/hyperframes-animation`,
  `/motion-graphics`…) las instala `npm run setup`. Si no están disponibles, pídele al
  usuario que lo corra y reinicie Claude Code; no reconstruyas su contenido de memoria.
- Comprueba `node -v` (22 o más) y `ffmpeg -version` si algo falla al arrancar.

## Flujo

1. **Brief en una sola ronda** (`AskUserQuestion`), solo lo que falte: qué marca
   (`brands/*.json`, sin contar `example`), qué clip, de qué trata el video y si lleva un
   llamado a la acción al final. Si el usuario dice "decide tú", sigue con lo razonable y dilo.
2. **Marca.** Si no hay marca propia, créala antes de seguir: pregunta handle, 3-4 colores
   (fondo, texto, acento y un segundo acento opcional) y la fuente (Inter viene incluida).
   Formato y reglas en `brands/README.md`. El texto de los subtítulos y el resaltado deben
   tener contraste ≥ 4.5:1 con la caja; `npm run captions` avisa si no.
3. **Proyecto.** `npm run new -- <slug> source/<clip> --brand <cuenta>` (slug en minúsculas
   con guiones). Prepara el clip a 30 fps, aplica la marca, transcribe en local y deja el
   proyecto renderizable. Si dice que la transcripción falló:
   `npx hyperframes models install parakeet` y `npm run captions -- <slug> --transcribe`.
4. **Encuadre.** Mira `projects/<slug>/frames/source-50.png` (y `-20`, `-80`). Estima el
   centro de la cara en píxeles de esa imagen y corre
   `npm run reframe -- <slug> --face X,Y`. Si avisa de que la cara queda fuera de la franja,
   díselo al usuario: el clip no tiene aire suficiente arriba o abajo.
5. **Transcripción.** Lee `transcript.json` (lista de `{text, start, end}`). Corrige solo
   `text`: nombres propios, marcas, números, términos técnicos, puntuación. No cambies
   `start`/`end` ni el orden. Luego `npm run captions -- <slug>`.
6. **Storyboard.** Divide lo que se dice en ideas de 2 a 6 s y escribe
   `projects/<slug>/storyboard.json` → `scenes`: `[{ "id": "scene-01", "start", "end",
   "kicker", "title", "intent" }]`. Cortes en el `start` de la primera palabra de cada idea;
   escenas seguidas, la primera en 0 y la última hasta `duration`. Después
   `npm run scenes -- <slug>`; para empezar de cero el diseño de una escena que ya existe,
   `--reset scene-02`.
7. **Escenas.** Diseña cada `compositions/scene-*.html` (slot de 1080x940) según lo que se
   dice en ese momento:

   | Si el guion trae… | Muestra |
   |---|---|
   | Una cifra | El número grande con conteo |
   | Pasos o una lista | Los elementos apareciendo al ritmo de la voz |
   | Una comparación | Dos columnas o antes/después |
   | Un proceso | Un diagrama simple que se arma |
   | Una frase fuerte | La cita en grande |
   | Un concepto | Un icono o metáfora visual |

   Reglas de cada escena: carga `/hyperframes-core` antes de escribir HTML de composición y
   `/hyperframes-animation` o `/motion-graphics` para el movimiento. Texto solo en
   `y 270-860`, `x 65-1015` del slot; colores con `var(--bg|--ink|--accent|--accent2)`;
   títulos de 80-96 px y textos de ≥ 40 px. Sincroniza con la voz: tiempo local =
   `start` de la palabra − `start` de la escena. Antes de construir a mano un efecto con
   nombre (glitch, gráfico, mapa, confeti…) búscalo en el registry:
   `npx hyperframes catalog <palabras>`, y adáptalo a 1080x940. La plantilla
   (`template/compositions/scene.html`) muestra el contrato: todo dentro de `<template>`,
   ids con el prefijo de la escena, script en una IIFE y
   `window.__timelines["<scene-id>"]` con el mismo id del slot. En `template/examples/` hay
   cuatro escenas que ya pasaron `check` y render (paso con objeto, acción, tecleo y
   diagrama sincronizado con la voz).
8. **Revisión.** `npm run check -- <slug>` hasta tener 0 errores (un error de lint apaga
   las auditorías de layout y contraste). Luego
   `npm run snapshot -- <slug> --at <mitad de cada escena separadas por comas>` y mira el
   `contact-sheet.jpg` que imprime: nada fuera de las zonas, cara visible, subtítulos legibles.
9. **Render.** `npm run render -- <slug>` → `renders/<slug>.mp4`, con el audio normalizado
   a -14 LUFS. En equipos con poca memoria libre: `--workers 1`.
10. **QA obligatoria.** Lanza el agente `video-qa-reviewer` con la ruta del MP4 y los
    `start` de las escenas. Si devuelve **BLOQUEA**, corrige y vuelve a renderizar. No
    entregues un video que no haya devuelto **LISTO**.
11. **Entrega.** Dile al usuario dónde está el MP4 y que lo suba a mano a Instagram.

## Reglas

- Las zonas no se mueven. Si una escena no cabe, se simplifica.
- No edites a mano lo generado: `<style id="brand">`, `<style id="talent">`, el bloque
  `SCENES` de `index.html` y `compositions/captions.html`. Se cambian desde su fuente
  (`brands/<cuenta>.json`, `npm run reframe`, `storyboard.json`, `transcript.json`).
- `source/`, `renders/`, `projects/` y las marcas propias no entran en Git: son personales.
- Ninguna clave (TTS, música, imágenes) en archivos del repo: van en variables de entorno.
- La versión del CLI está fijada en `package.json` → `config.hyperframes`. Para subirla,
  cámbiala ahí y vuelve a pasar `check` y `render`.
