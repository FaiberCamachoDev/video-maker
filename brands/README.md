# Marcas

Una cuenta = un archivo `brands/<cuenta>.json`. El pipeline es el mismo para todas; lo único
que cambia entre cuentas es la identidad visual. `example.json` trae valores ficticios.

Tus marcas y las fuentes que agregues **no se suben a Git** (el `.gitignore` solo deja pasar
`example.json`, este README y `fonts/inter/`): son tuyas, y una fuente comercial publicada por
error en un repo público es una infracción de su licencia. Si quieres versionarlas en tu
propio fork privado, quita esa regla.

## Formato

```json
{
  "account": "mi-cuenta",
  "handle": "@mi.cuenta",
  "palette": { "bg": "#0A0C12", "ink": "#F5F5F0", "accent": "#FF7A45", "accent2": "#3DD6D0" },
  "fonts": { "display": "Inter", "body": "Inter" },
  "logo": null,
  "captions": { "size": 64, "weight": 800, "case": "sentence", "highlight": "accent", "box": "bg" },
  "style": "editorial"
}
```

| Campo | Qué es | Reglas |
|---|---|---|
| `account` | Nombre corto de la cuenta | Igual al nombre del archivo |
| `handle` | Usuario de Instagram | Aparece como antetítulo en las escenas por defecto |
| `palette.bg` | Fondo de la ilustración y de la caja de subtítulos | `#RRGGBB` |
| `palette.ink` | Texto principal | `#RRGGBB`, contraste ≥ 4.5:1 con `bg` |
| `palette.accent` | Color de acento y palabra activa del subtítulo | `#RRGGBB` |
| `palette.accent2` | Segundo acento (opcional) | `#RRGGBB` |
| `fonts.display` / `fonts.body` | Familias de títulos y de texto | Deben existir en `brands/fonts/<familia>/` |
| `logo` | Ruta a un SVG/PNG propio, o `null` | Ponlo en `brands/<cuenta>/` (ignorado por Git) |
| `captions.size` | Tamaño de los subtítulos en px | 56-96 (56 px ≈ 40 px de altura de mayúscula) |
| `captions.weight` | Grosor | 400-900, según los pesos que tengas de la fuente |
| `captions.case` | `sentence`, `upper` o `lower` | |
| `captions.highlight` | Color de la palabra que se está diciendo | Nombre de un color de `palette` |
| `captions.box` | Caja detrás del subtítulo | Nombre de un color de `palette`, o `"none"` (texto con sombra) |
| `style` | Pista de estilo para las escenas | Texto libre: `editorial`, `minimal`, `bold`… |

## Fuentes

Las fuentes se copian al proyecto y se cargan en local: el render no depende de internet.
Cada familia va en su carpeta, un archivo por peso:

```
brands/fonts/inter/Inter-400.woff2
brands/fonts/inter/Inter-800.woff2
brands/fonts/inter/OFL.txt
```

Inter (SIL Open Font License 1.1, de `@fontsource/inter` 5.3.0) viene incluida. Para otra
familia, usa una con licencia que permita incrustarla (las de Google Fonts son OFL), descarga
los `.woff2` (por ejemplo del paquete npm `@fontsource/<familia>`, archivos `*-latin-<peso>-normal.woff2`),
renómbralos a `<Familia>-<peso>.woff2` y deja su licencia al lado.
