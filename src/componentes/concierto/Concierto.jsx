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

        <section className="conciertoBloque conciertoInfoBloque">
          <h2 className="conciertoBloqueTitulo">Sobre el show</h2>

          <div className="conciertoInfo">
            <CardEstadio estadio={concierto.estadio} />
            <FansUnidos
              fans={concierto.usuarios}
              cantidadFans={concierto.cantidadFans || concierto.asistentes || 0}
              onConocerlos={onVerFansUnidos}
            />
          </div>
        </section>

        <section className="conciertoBloque conciertoGrupos">
          <div className="conciertoBloqueHeader">
            <h2 className="conciertoBloqueTitulo">Grupos del concierto</h2>
            <FiltroSubEvento
              filtros={filtros}
              filtroActivo={filtroActivo}
              onCambiarFiltro={setFiltroActivo}
            />
          </div>

          {gruposFiltrados.length > 0 ? (
            <Carrusel
              subEventos={gruposFiltrados}
              onAbrirGrupo={onAbrirGrupo}
            />
          ) : (
            <p className="conciertoSinGrupos">
              No hay grupos en esta categoría todavía. ¡Creá el primero!
            </p>
          )}

          <button className="btn-crear-grupo" onClick={onCrearGrupo}>
            Crear grupo para este concierto ＋
          </button>
        </section>
      </main>

      <Footer onNavegar={onNavegar} />    
    </div>
  );
}

export default Concierto;