// Consejos de seguridad al unirse a un grupo: se guarda por navegador si
// alguien marcó "no volver a mostrar" (ver ModalConsejosSeguridad).
const CLAVE_OCULTAR = "fm-consejos-grupo-ocultos";

export function consejosOcultos() {
  try {
    return localStorage.getItem(CLAVE_OCULTAR) === "1";
  } catch {
    return false;
  }
}

export function ocultarConsejos() {
  try {
    localStorage.setItem(CLAVE_OCULTAR, "1");
  } catch {
    // Sin localStorage (modo privado): se vuelven a mostrar, no pasa nada.
  }
}
