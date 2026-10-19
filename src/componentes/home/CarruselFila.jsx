import { Children, useLayoutEffect, useRef } from "react";
import "./CarruselFila.css";
import { IconoAnterior, IconoSiguiente } from "../generales/iconosNav";

export default function CarruselFila({ children }) {
  const scrollRef = useRef(null);
  const arrastre = useRef({ activo: false, inicioX: 0, scrollInicial: 0, movio: false });

  // Si cambian las cards (ej. "Para vos" muestra primero las de tus géneros
  // y después llegan las del backend en otro orden), el scroll-snap se queda
  // pegado a la card en la que estaba, que puede haber quedado en el medio.
  // Cuando cambia la lista, el carrusel vuelve al principio.
  const claves = Children.toArray(children)
    .map((hijo) => hijo?.key)
    .join("|");

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "instant" });
  }, [claves]);

  function desplazar(direccion) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function manejarMouseDown(e) {
    const el = scrollRef.current;
    if (!el) return;
    arrastre.current = { activo: true, inicioX: e.pageX, scrollInicial: el.scrollLeft, movio: false };
  }

  function manejarMouseMove(e) {
    if (!arrastre.current.activo) return;
    const el = scrollRef.current;
    const delta = e.pageX - arrastre.current.inicioX;
    if (Math.abs(delta) > 4) arrastre.current.movio = true;
    el.scrollLeft = arrastre.current.scrollInicial - delta;
  }

  function terminarArrastre() {
    arrastre.current.activo = false;
  }

  function manejarClickCapture(e) {
    // Si veníamos de arrastrar con el mouse, ese click no debe abrir la card.
    if (arrastre.current.movio) {
      e.stopPropagation();
      e.preventDefault();
      arrastre.current.movio = false;
    }
  }

  return (
    <div className="carruselFila">
      <button
        type="button"
        className="carruselFilaFlecha carruselFilaFlechaIzq"
        onClick={() => desplazar(-1)}
        aria-label="Anterior"
        tabIndex={-1}
      >
        <IconoAnterior />
      </button>

      <div
        className="home-row-scroll"
        ref={scrollRef}
        onMouseDown={manejarMouseDown}
        onMouseMove={manejarMouseMove}
        onMouseUp={terminarArrastre}
        onMouseLeave={terminarArrastre}
        onClickCapture={manejarClickCapture}
      >
        {children}
      </div>

      <button
        type="button"
        className="carruselFilaFlecha carruselFilaFlechaDer"
        onClick={() => desplazar(1)}
        aria-label="Siguiente"
        tabIndex={-1}
      >
        <IconoSiguiente />
      </button>
    </div>
  );
}
