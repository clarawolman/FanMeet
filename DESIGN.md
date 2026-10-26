---
version: 1
name: FanMeet
description: Red social para conocer gente que va a los mismos recitales. Interfaz neutra y fotográfica (las fotos de los artistas ponen el color), un solo acento fucsia y la entrada de recital como motivo propio. Mobile primero, con modo claro y oscuro que comparten el mismo diseño.

colors:
  # Valores de src/App.css. En el código se usan SIEMPRE como var(--fm-*).
  light:
    bg: "#f6f4f7"            # --fm-bg: fondo de pantalla
    bg-soft: "#ece9ef"       # --fm-bg-soft: hover, placeholders
    surface: "#ffffff"       # --fm-surface: tarjetas
    ink: "#0f0f13"           # --fm-ink: texto
    muted: "#686874"         # --fm-muted: texto secundario
    accent: "#e62e6b"        # --fm-accent: rosa FanMeet
    accent-soft-ink: "#b8164d"
    cta: "#0f0f13"           # --fm-cta: acción principal (tinta)
    success: "#15803d"
    danger: "#c42b2b"
  dark:
    bg: "#0c0b0f"
    bg-soft: "#1a181e"
    surface: "#131317"
    ink: "#f4f4f6"
    muted: "#8e8e9a"
    accent: "#ff3d7f"
    accent-soft-ink: "#ff8fb5"
    cta: "#f4f4f6"
    success: "#4ade80"
    danger: "#ff7b72"

typography:
  family: "Geist, system-ui, -apple-system, sans-serif"   # una sola familia
  scale:                     # --fm-fs-* (en mobile, medio punto más)
    2xs: 11px
    xs: 12.5px
    sm: 13.5px
    body: 15px
    md: 16px
    lg: 19px
    xl: 26px
    2xl: 34px
    3xl: 44px

radius: { sm: 10px, md: 14px, lg: 20px, pill: 999px }
motion: { duration: 180ms, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
layout: { sidebar: 248px, content-max: 1120px, desktop-query: "(min-width: 1024px) and (hover: hover) and (pointer: fine)" }
---

# FanMeet: sistema de diseño

> Las reglas para escribir código están en la skill
> `.claude/skills/fanmeet-ui/SKILL.md`. Este documento explica el porqué.

## Personalidad

FanMeet tiene que sentirse como **la previa de un recital**: con ganas,
cercano, entre fans. No es una app de tickets fría ni un clon de Instagram.

- **Las fotos mandan.** La base es neutra (casi blanco de día, casi negro
  de noche, con un toque violáceo para que no quede gris muerto). El color
  lo traen las fotos de artistas, conciertos y momentos.
- **Un solo acento.** El rosa FanMeet marca lo vivo: lo activo, lo
  seleccionado, la compatibilidad, los badges. No hay segundo color de
  marca (los alias viejos `--fm-purple`, `--fm-coral`, etc. apuntan al rosa).
- **La acción principal va en tinta.** Los botones fuertes son negros de
  día y blancos de noche, como en las apps de música y entradas. El rosa no
  compite con las fotos.
- **La entrada de recital** es el motivo propio de la marca: un talón
  separado por una línea troquelada con muescas a los costados.

## El motivo de la entrada

Se usa en lo que representa un recital o un recuerdo de uno:

| Dónde | Archivo |
|---|---|
| Datos clave de un concierto o grupo (fecha, hora, lugar) | `generales/TiraTicket.css` |
| Grilla de momentos del perfil (foto + talón con concierto y fecha) | `perfil/highlightsPerfil.css` |
| Pantalla de un momento (fotos arriba, talón con quiénes fueron, reacciones y comentarios) | `momento/MomentoDetalle.css` |
| Página 404 (una entrada inclinada) | `generales/PaginaNoEncontrada.css` |

Cómo se arma: `border-top` (o `border-left`) de `1.5px dashed
var(--fm-border-strong)`, y dos círculos con `::before` / `::after` del
color `--fm-bg`, cortados a la mitad con `clip-path`, sobre la línea.

No se usa en listas, formularios ni configuración: ahí van tarjetas lisas
(`--fm-surface`, borde `--fm-card-borde`, radio `--fm-radius-lg`).

## Color

- Fondo `--fm-bg`, tarjetas `--fm-surface`, bordes `--fm-border` /
  `--fm-card-borde`.
- Texto `--fm-ink`; secundario `--fm-muted` (nunca para lo importante).
- Seleccionado: `--fm-accent-soft-bg` de fondo, `--fm-accent-soft-border`
  de borde, `--fm-accent` de texto.
- Sobre fotos: `--fm-on-photo` y el degradé `--fm-scrim` para que el texto
  se lea.
- Peligro: `--fm-danger` y `--fm-danger-bg`. Éxito: `--fm-success`.

Día y noche son **el mismo diseño con otros valores**: el modo oscuro se
activa con `data-theme="dark"` en `<html>` y redefine las variables. El
usuario elige claro, oscuro o "según el dispositivo" en Configuración.

## Tipografía

Una sola familia, Geist, en toda la app (`--fm-font-display`,
`--fm-font-body` y `--fm-font-data` apuntan a la misma).

- Títulos: peso 600–650, `letter-spacing` negativo (-0.01 a -0.02em).
- Etiquetas tipo "talón" (fechas, "ESTUVE AHÍ", títulos de grupo): chicas,
  mayúsculas, `letter-spacing` 0.08–0.14em.
- Números con `tabular-nums` (`.fmDato`).
- En el celular la escala sube medio punto: se lee a distancia de brazo.

## Forma, profundidad y movimiento

- Radios: 10 / 14 / 20px y `pill` para botones, chips y píldoras.
- Sombras difusas con una sola luz desde arriba (`--fm-shadow-sm`,
  `--fm-shadow`). De noche se suma un brillo fino arriba.
- Movimiento corto y suave (180ms, ease-out). Todo respeta
  `prefers-reduced-motion` y la opción "Reducir animaciones".

## Layout

- **Mobile primero.** Barra de navegación abajo (Inicio, Eventos, Chat,
  Perfil); el resto en el menú lateral (Descubrir, Grupos, Notificaciones,
  Configuración).
- **Escritorio** (pantalla ancha **con mouse**): la barra pasa a un sidebar
  fijo de 248px a la izquierda y el contenido se centra hasta 1120px.
- **Tablet:** el diseño de celular agrandado con CSS `zoom` (`--fm-zoom`,
  hasta 1.6x). Por eso todo `vh`/`vw` se divide por `--fm-zoom`. El
  "Tamaño del texto" de Configuración usa el mismo mecanismo.

## Voz

Castellano rioplatense, de vos, como habla un fan: "Unite", "Estuve ahí",
"Fueron juntos", "Mandale una solicitud". Mensajes cortos que dicen qué
pasó y qué hacer; nunca el error técnico del servidor.
