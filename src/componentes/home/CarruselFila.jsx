import { useRef } from "react";
import "./CarruselFila.css";

export default function CarruselFila({ children }) {
  const scrollRef = useRef(null);
  const arrastre = useRef({ activo: false, inicioX: 0, scrollInicial: 0, movio: false });

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
        ‹
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
        ›
      </button>
    </div>
  );
}
