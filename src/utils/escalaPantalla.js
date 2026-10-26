// Escala de toda la interfaz (CSS zoom) según el ancho de la ventana.
// - Escritorio (≥ 1024px Y con mouse/trackpad): tamaño real.
// - Celular (< 600px): tamaño real.
// - Tablet (600px o más, o cualquier pantalla táctil ancha, como el iPad Pro
//   13"): el mismo diseño de celular, agrandado como si la pantalla midiera
//   600px, hasta 1.6x.
// La condición de escritorio es la misma que usan los @media de los CSS.
// Encima se aplica el "Tamaño del texto" de Configuración.
export const MEDIA_ESCRITORIO = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

export const FACTOR_TEXTO = { normal: 1, grande: 1.1, enorme: 1.2 };

export function calcularEscala(ancho, esEscritorio) {
  if (esEscritorio || ancho < 600) return 1;
  return Math.min(ancho / 600, 1.6);
}

function leerFactorGuardado() {
  try {
    return FACTOR_TEXTO[localStorage.getItem("fm-texto")] || 1;
  } catch {
    return 1;
  }
}

let factorTexto = 1;
let aplicar = () => {};

export function iniciarEscalaPantalla() {
  const raiz = document.documentElement;
  const escritorio = window.matchMedia(MEDIA_ESCRITORIO);
  factorTexto = leerFactorGuardado();
  aplicar = () => {
    const escala = calcularEscala(window.innerWidth, escritorio.matches) * factorTexto;
    raiz.style.setProperty("--fm-zoom", escala.toFixed(3));
  };
  aplicar();
  window.addEventListener("resize", aplicar);
  // si se conecta/desconecta un mouse o cambia el puntero principal
  escritorio.addEventListener?.("change", aplicar);
}

// Configuración → Tamaño del texto ("normal" | "grande" | "enorme")
export function cambiarTamanoTexto(tamano) {
  factorTexto = FACTOR_TEXTO[tamano] || 1;
  aplicar();
}
