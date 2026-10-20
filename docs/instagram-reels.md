# Instagram Reels: formato, zonas seguras y export

- **Actualizada:** 2026-10-19
- **Revisar:** cada 6 meses o cuando Meta cambie la UI de Reels.
- **La usan:** la skill `reels-split`, el agente `video-qa-reviewer` y los scripts de `scripts/`
  (las zonas están copiadas en `scripts/lib/common.mjs` → `LAYOUT`; si cambias un número aquí,
  cámbialo también allí).

> **Grado de verificación.** La página oficial de Meta (Ads Guide) no se pudo leer el
> 2026-10-19 porque redirige y se renderiza con JS. Los números vienen de varias guías de
> terceros que la citan y que coinciden entre sí. Antes de un lanzamiento importante,
> compáralos con la vista previa de Ads Manager o con la app.
> Oficial: <https://www.facebook.com/business/ads-guide/update/video/instagram-reels>
> · <https://help.instagram.com/>

## Formato

| Parámetro | Valor del kit | Lo que acepta Instagram | Fuente |
|---|---|---|---|
| Relación | **9:16** | 1.91:1 a 9:16 | Terceros, citando el Help Center |
| Resolución | **1080x1920** | Mín. 720 px. El Ads Guide recomienda 1440x2560 para anuncios | Terceros |
| fps | **30** (60 solo con movimiento rápido) | Mín. 30 | Terceros |
| Contenedor | **MP4** | MP4 o MOV | Terceros |
| Video | **H.264, `yuv420p`** | — | Práctica: es lo que menos recomprime la plataforma |
| Audio | **AAC 48 kHz estéreo** | — | Práctica |
| Peso | < 4 GB | 4 GB máx. | Terceros |
| Duración | **15-90 s** para alcance | Hasta 3 min con recomendación a público nuevo; las subidas largas se aceptan pero no se recomiendan | Terceros, citando el anuncio de A. Mosseri de ene-2025 |
| Portada | 1080x1920; la cuadrícula del perfil recorta al centro 3:4 | 420x654 citado | Terceros |

## Zonas seguras (1080x1920)

Meta las publica en porcentajes. Esta es la cifra que más se repite:

| Borde | % | px | Qué tapa |
|---|---|---|---|
| Arriba | 14 % | 269 | Usuario, audio, etiqueta de patrocinado |
| Abajo | 35 % | 672 | Caption, pista de audio, CTA |
| Lados | 6 % c/u | 65 | Recorte en pantallas distintas |
| Derecha (desde `y` ≈ 1100) | — | ~120 | Columna de like, comentar, compartir y guardar |

**Zona de texto:** `x 65-1015`, `y 270-1248`. Hay guías con márgenes más pequeños (9 % y
25 %): el kit usa el 14 % y el 35 % porque cubren el peor caso.

## Layout `reels-split`

| Zona | Límites (px) | Por qué |
|---|---|---|
| Ilustración | `y 0-940`; texto solo en `y 270-860`, `x 65-1015` | El 14 % superior lo tapa la UI; los lados llevan un 6 % de margen |
| Subtítulos | `y 860-1000`, centrados, 1 línea | En la costura: no tapan la cara ni la ilustración, muy por encima del 35 % inferior |
| Persona | `y 940-1920`, `object-fit: cover` | La cara va entre `y 1000` y `y 1248`; lo de abajo puede quedar bajo la UI porque solo son hombros |
| Botones | `x > 960` desde `y 1100` | Likes, comentarios y compartir: ahí nunca va texto |

## Subtítulos (valores del kit)

Meta no fija un mínimo. Estos valores están pensados para leer en un celular sin acercarlo:

| Parámetro | Valor | Por qué |
|---|---|---|
| Altura de la mayúscula | **≥ 40 px** (fuente ≥ 56 px) a 1080x1920 | En un celular de 6", 40 px del lienzo se ven como ~2,3 mm |
| Líneas | 1 por grupo, ≤ 4 palabras | Dos líneas legibles no caben en la franja de 140 px |
| Contraste | **≥ 4.5:1** texto/fondo (WCAG 2.2 AA) o caja/contorno sólido | El fondo cambia con cada escena |
| Posición | Franja `y 860-1000` | No tapan la cara ni la ilustración |

## Sonoridad

Meta no publica un objetivo. Por convención de plataformas móviles el kit usa **-14 LUFS
integrados ±1** y **true peak ≤ -1 dBTP** (`npm run render` normaliza a -14 LUFS y -1,5 dBTP).
Cómo medirlo:

```bash
ffmpeg -hide_banner -i renders/video.mp4 -af loudnorm=print_format=json -f null - 2>&1 | tail -n 12
```

## Comprobar un render

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name,pix_fmt -of csv=p=0 renders/video.mp4
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 renders/video.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 renders/video.mp4
```

Resultado esperado: `h264,1080,1920,yuv420p,30/1` (el orden lo pone ffprobe), `aac,48000,2`
y una duración de 15 a 90 s.

## Fuentes consultadas (2026-10-19)

- <https://superprofile.bio/guides/instagram-reel-size>
- <https://postfa.st/sizes/instagram/reels>
- <https://www.hopperhq.com/blog/instagram-reel-size/>
- <https://kive.ai/learn/meta-ad-sizes>
- <https://www.biddyco.com/blog-posts/meta-ad-specs>
- <https://adsuploader.com/blog/meta-ads-safe-zones>
- <https://www.poster.ly/tools/meta-ads-safe-zone-visualizer> (márgenes menores, descartados)
