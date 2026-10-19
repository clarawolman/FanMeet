import { useRef, useState, useEffect } from "react";
import SubEventos from "./SubEventos";
import "./Carrusel.css";
import { IconoAnterior, IconoSiguiente } from "../generales/iconosNav";

function Carrusel({ subEventos, onAbrirGrupo }) {
  const ref = useRef(null);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateArrows = () => {
    const el = ref.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setShowLeft(scrollLeft > 5);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateArrows();

    el.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);

    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;

    const card = el.querySelector(".SubEventoCard");
    const step = (card?.offsetWidth || 240) + 14;

    el.scrollBy({
      left: dir === "left" ? -step * 2 : step * 2,
      behavior: "smooth",
    });
  };

  const hideArrowsIfFew = subEventos.length <= 3;

  return (
    <div className="CarruselWrapper">

      {!hideArrowsIfFew && showLeft && (
        <button type="button" className="CarruselBtn left" onClick={() => scroll("left")} aria-label="Grupos anteriores">
          <IconoAnterior />
        </button>
      )}

      <div className="SubEventosCarrusel" ref={ref}>
        {subEventos.map((ev) => (
          <SubEventos
            key={ev.id_grupo}
            subEvento={ev}
            onAbrirGrupo={onAbrirGrupo}
          />
        ))}
      </div>

      {!hideArrowsIfFew && showRight && (
        <button type="button" className="CarruselBtn right" onClick={() => scroll("right")} aria-label="Más grupos">
          <IconoSiguiente />
        </button>
      )}

    </div>
  );
}

export default Carrusel;