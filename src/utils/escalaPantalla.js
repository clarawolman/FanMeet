// Escala de toda la interfaz (CSS zoom) según el ancho de la ventana.
// - Escritorio (≥ 1024px Y con mouse/trackpad): tamaño real.
// - Celular (< 600px): tamaño real.
// - Tablet (600px o más, o cualquier pantalla táctil ancha, como el iPad Pro
//   13"): el mismo diseño de celular, agrandado como si la pantalla midiera
//   600px, hasta 1.6x.
// La condición de escritorio es la misma que usan los @media de los CSS.
export const MEDIA_ESCRITORIO = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

export function calcularEscala(ancho, esEscritorio) {
  if (esEscritorio || ancho < 600) return 1;
  return Math.min(ancho / 600, 1.6);
}

export function iniciarEscalaPantalla() {
  const raiz = document.documentElement;
  const escritorio = window.matchMedia(MEDIA_ESCRITORIO);
  const aplicar = () => {
    raiz.style.setProperty("--fm-zoom", calcularEscala(window.innerWidth, escritorio.matches).toFixed(3));
  };
  aplicar();
  window.addEventListener("resize", aplicar);
  // si se conecta/desconecta un mouse o cambia el puntero principal
  escritorio.addEventListener?.("change", aplicar);
}
