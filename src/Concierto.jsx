import { useState } from "react";

import "./Concierto.css";

import HeaderConcierto from "./HeaderConcierto";
import CardEvento from "./CardEvento";
import CardEstadio from "./CardEstadio";
import FansUnidos from "./FansUnidos";
import FiltroSubEvento from "./FiltroSubEvento";
import SubEventos from "./SubEventos";

function Concierto({ concierto }) {
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const filtros = [
    { id: "todos", nombre: "Todos" },
    { id: "pre", nombre: "Pre" },
    { id: "after", nombre: "After" },
    { id: "mismo-dia", nombre: "Mismo día" },
  ];

  const subEventos = concierto.subEventos || [];

  const subEventosFiltrados =
    filtroActivo === "todos"
      ? subEventos
      : subEventos.filter(
          (subEvento) => subEvento.categoria === filtroActivo
        );

  return (
    <main className="Concierto">
      <div className="ConciertoPantalla">
        <HeaderConcierto concierto={concierto} />

        <section className="ConciertoContenido">
          <CardEvento concierto={concierto} />

          <CardEstadio estadio={concierto.estadio} />

          <FansUnidos fans={concierto.fans || []} />

          <FiltroSubEvento
            filtros={filtros}
            filtroActivo={filtroActivo}
            setFiltroActivo={setFiltroActivo}
          />

          <section className="SubEventosLista">
            {subEventosFiltrados.map((subEvento) => (
              <SubEventos
                key={subEvento.id_sub_evento}
                subEvento={subEvento}
              />
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

export default Concierto;