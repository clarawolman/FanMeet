// Avisos breves al pie de la pantalla (reemplazan a window.alert).
// Cualquier componente llama mostrarAviso("texto") y <Avisos /> lo muestra.
export function mostrarAviso(texto, tipo = "error") {
  window.dispatchEvent(new CustomEvent("fm-aviso", { detail: { texto, tipo } }));
}
