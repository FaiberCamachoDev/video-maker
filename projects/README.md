# projects/

Un proyecto HyperFrames por video, creado con `npm run new -- <slug> source/<clip>`.
Esta carpeta no se sube a Git; solo este README.

```
projects/<slug>/
  index.html            composición principal (zonas fijas, desde template/)
  storyboard.json       marca, duración y escenas  ← lo escribe Claude
  transcript.json       palabras con tiempos        ← se corrige solo el "text"
  compositions/
    scene-*.html        una escena por idea         ← las diseña Claude
    captions.html       subtítulos (generado por npm run captions)
  assets/source.mp4     el clip preparado a 30 fps
  fonts/                fuentes de la marca (copiadas)
  frames/               fotogramas del clip para revisar el encuadre
```
