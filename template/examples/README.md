# Escenas de ejemplo

Cuatro escenas reales (slot de 1080x940) que pasaron `npm run check` sin errores y se
renderizaron. Sirven de referencia de patrones, no para copiarlas tal cual: usan `"Inter"`
escrito a mano, y en un proyecto la fuente sale de la marca (la pone `npm run scenes`).

| Archivo | Patrón | Técnica |
|---|---|---|
| `scene-02.html` | Paso con objeto | Teléfono que gira de horizontal a vertical (`rotation` + `back.out`), punto REC que parpadea con repeticiones finitas |
| `scene-03.html` | Acción sobre un objeto | Archivo que entra y "cae" en una carpeta; la carpeta rebota (`yoyo`, `immediateRender: false`) |
| `scene-04.html` | Texto que se escribe | Un `span` por carácter creado antes del timeline y `stagger`: tecleo determinista |
| `scene-05.html` | Diagrama sincronizado con la voz | Cada franja se enciende cuando la voz la nombra (tiempo local = palabra − inicio de escena) |
