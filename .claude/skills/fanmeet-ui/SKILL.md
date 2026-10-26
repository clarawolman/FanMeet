---
name: fanmeet-ui
description: Reglas de estilo de la app de FanMeet (React + CSS propio, sin Tailwind). Usala siempre que crees o cambies una pantalla, un componente o un archivo .css de src/ (layout, colores, tipografía, tarjetas, botones, modo oscuro, mobile/escritorio, animaciones o textos de la interfaz), y antes de usar cualquier otra skill de diseño: las demás dan ideas generales, esta dice cómo se hace en FanMeet.
---

# Estilo de FanMeet

FanMeet es una red para conocer gente que va a los mismos recitales. La
interfaz es neutra (las fotos de los artistas ponen el color), con un solo
acento fucsia y un motivo propio: **la entrada de recital** (talón con
troquelado y muescas). El detalle completo está en `DESIGN.md`; los valores
viven en `src/App.css` (`:root` y `:root[data-theme="dark"]`).

## Antes de escribir CSS

1. Mirá cómo resuelve lo mismo una pantalla parecida (`src/componentes/...`)
   y copiá su estructura y sus nombres. Cada componente tiene su `.css` al
   lado, con clases en camelCase con el prefijo del componente
   (`momentoPanel`, `highlightCardTalon`, `configGrupo`).
2. Reusá lo que ya existe antes de crear algo nuevo:
   - `HeaderApp` (título, volver, acciones) y `Footer` (barra de abajo en
     mobile, sidebar en escritorio) en toda pantalla con sesión.
   - `TiraTicket` para datos clave (fecha, hora, lugar) como talón.
   - `ModalConfirmacion`, `LoadingSpinner`, `Buscador`, `BotonConectar`,
     `AnilloCompatibilidad`, `PaginaNoEncontrada`.
   - Clases globales: `.fmBotonPrimario`, `.fmSkeleton`, `.fmChipGenero`,
     `.fmDato`, `.fmSoloLectores` (texto solo para lectores de pantalla).
   - Avisos con `mostrarAviso(texto, "error" | "exito" | "info")` de
     `utils/avisos.js`, nunca `alert()`.

## Reglas

**Colores: solo variables `--fm-*`.** Nada de hex sueltos para fondo,
texto o bordes: así el modo oscuro sale solo. La única excepción es lo que
va arriba de una foto (`--fm-on-photo`, `--fm-scrim`, o un `rgba(8, 8, 12, …)`
para una píldora sobre la imagen).
- Fondo de pantalla `--fm-bg`; tarjetas `--fm-surface` con borde
  `1px solid var(--fm-card-borde)`.
- Texto `--fm-ink`, secundario `--fm-muted`.
- **La acción principal va en tinta, no en rosa**: `.fmBotonPrimario` usa
  `--fm-cta` (negro de día, blanco de noche).
- El rosa (`--fm-accent`) es para estado activo, seleccionado, badges,
  compatibilidad y links. Seleccionado = `--fm-accent-soft-bg` +
  `--fm-accent-soft-border` + texto `--fm-accent`.
- Peligro (eliminar, bloquear) con `--fm-danger` / `--fm-danger-bg`.

**Tipografía:** una sola familia (Geist). Tamaños solo con `--fm-fs-2xs`
… `--fm-fs-3xl`. Títulos con `--fm-font-display`, peso 600–650 y
`letter-spacing` negativo. Etiquetas chicas en mayúsculas con
`letter-spacing: 0.08em–0.14em`. Números (fechas, contadores, porcentajes)
con `font-variant-numeric: tabular-nums`.

**Forma:** radios `--fm-radius-sm|md|lg|pill`; sombras `--fm-shadow-sm`
y `--fm-shadow`; capas con `--fm-z-*`, nunca un `z-index` inventado.
Botones y chips redondeados (`pill`).

**Movimiento:** transiciones con `var(--fm-dur) var(--fm-ease)`. Toda
animación tiene su bloque `@media (prefers-reduced-motion: reduce)`; la
opción "Reducir animaciones" de Configuración ya se aplica sola desde
`App.css`. Nada de `transform` en `:active` de elementos que se tocan para
navegar (rompía los toques en las notificaciones).

**El motivo de la entrada:** para lo que es "un recital" o "un recuerdo de
un recital" (conciertos, momentos, datos de un grupo): talón separado por
`1.5px dashed var(--fm-border-strong)` con muescas circulares del color
`--fm-bg` a los costados. Ejemplos: `TiraTicket.css`,
`highlightsPerfil.css` (`.highlightCard::before/::after`),
`MomentoDetalle.css` (`.momentoPanel`). No lo uses en todo: en listas,
formularios y configuración van tarjetas lisas.

## Mobile y escritorio

- Se diseña primero para el celular (~400px de ancho).
- Escritorio es **siempre** este media query (el mismo que usa
  `utils/escalaPantalla.js`):
  `@media (min-width: 1024px) and (hover: hover) and (pointer: fine)`.
  Ahí la pantalla suma `padding-left: var(--fm-sidebar)` por el sidebar.
- En mobile, el contenido deja lugar abajo para la barra:
  `padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px))`.
- Toda la interfaz se escala con CSS `zoom` (`--fm-zoom`, también por el
  "Tamaño del texto"). **Cualquier `vh`/`vw`/`dvh` se divide por
  `var(--fm-zoom)`**: `min-height: calc(100dvh / var(--fm-zoom))`.
- Nada más ancho que la pantalla: textos largos con `min-width: 0` +
  `text-overflow: ellipsis` u `overflow-wrap: anywhere`.

## Modo claro y oscuro

El tema se pone con `data-theme` en `<html>` (`TemaContext`). Si usaste
solo variables, no hay que hacer nada más. Si algo necesita un valor
distinto de noche, se agrega con `:root[data-theme="dark"] .miClase {…}`
y se prueba en los dos modos.

## Accesibilidad

- Botones de solo ícono con `aria-label`. Interruptores con
  `role="switch"` + `aria-checked`; grupos de opciones con
  `role="radiogroup"`.
- Foco visible: `outline: 2px solid var(--fm-accent)` en
  `:focus-visible`.
- Áreas táctiles de 36–44px de alto como mínimo.
- Contraste: `--fm-muted` solo para texto secundario, nunca para lo
  importante.

## Textos

Castellano rioplatense, de vos, cortos y concretos: "Unite", "Mandale una
solicitud", "No se pudo guardar: …". Sin términos técnicos ni mensajes del
servidor tal cual. Los comentarios del código también van en castellano.

## Antes de terminar

- [ ] Sin colores sueltos (buscá `#` y `rgb` en el diff).
- [ ] Se ve bien a 400px y en escritorio, en claro y en oscuro.
- [ ] `vh`/`vw` divididos por `--fm-zoom`.
- [ ] Animaciones con su `prefers-reduced-motion`.
- [ ] `npx eslint` de los archivos tocados y `npx vite build` sin errores.
- [ ] Si se puede abrir la app, sacá una captura y mirala.
