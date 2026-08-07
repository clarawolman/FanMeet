import { useState } from "react";
import "./Concierto.css";

import HeaderConcierto from "./HeaderConcierto";
import CardEvento from "./CardEvento";
import CardEstadio from "./CardEstadio";
import FansUnidos from "./FansUnidos";
import FiltroSubEvento from "./FiltroSubEvento";
import SubEventos from "./SubEventos";
import Carrusel from "./Carrusel";
import Footer from "../generales/Footer";

function Concierto({ concierto, onAbrirGrupo, onCrearGrupo, onNavegar, onVolver, onVerFansUnidos }) {
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const filtros = [
    { id: "todos", nombre: "Todos" },
    { id: "pre", nombre: "Pre" },
    { id: "after", nombre: "After" },
    { id: "mismo_dia", nombre: "Hoy" },
  ];

  const grupos = concierto?.grupos || [];

  const gruposFiltrados =
    filtroActivo === "todos"
      ? grupos
      : grupos.filter((grupo) => grupo.categoria === filtroActivo);

  console.log("FILTRO ACTIVO:", filtroActivo);

  return (
    <div className="pantalla-concierto">
      <HeaderConcierto concierto={concierto} onVolver={onVolver} />

      <main className="conciertoLayout">
        <section className="conciertoHero">
          <CardEvento concierto={concierto} />
        </section>

        <section className="conciertoInfo">
          <CardEstadio estadio={concierto.estadio} />
          <FansUnidos
            fans={concierto.usuarios}
            cantidadFans={concierto.cantidadFans || concierto.asistentes || 0}
            onConocerlos={onVerFansUnidos}
          />
          </section>

        <section className="conciertoGrupos">
          <FiltroSubEvento
            filtros={filtros}
            filtroActivo={filtroActivo}
            onCambiarFiltro={setFiltroActivo}
          />

          <Carrusel
            subEventos={gruposFiltrados}
            onAbrirGrupo={onAbrirGrupo}
          />

          {gruposFiltrados.length === 0 && (
            <p className="conciertoSinGrupos">
              No hay grupos en esta categoría todavía.
            </p>
          )}

          <button className="btn-crear-grupo" onClick={onCrearGrupo}>
            CREAR GRUPO ＋
          </button>
        </section>
      </main>

      <Footer onNavegar={onNavegar} />    
    </div>
  );
}

export default Concierto;