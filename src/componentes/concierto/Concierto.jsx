import { useState } from "react";
import "./Concierto.css";

import HeaderConcierto from "./HeaderConcierto";
import CardEvento from "./CardEvento";
import CardEstadio from "./CardEstadio";
import FansUnidos from "./FansUnidos";
import FiltroSubEvento from "./FiltroSubEvento";
import Carrusel from "./Carrusel";
import Footer from "../generales/Footer";
import TiraTicket from "../generales/TiraTicket";
import { formatearFechaLarga } from "../../utils/fechas";

const FILTROS = [
  { id: "todos", nombre: "Todos" },
  { id: "pre", nombre: "Pre" },
  { id: "after", nombre: "After" },
  { id: "mismo_dia", nombre: "Hoy" },
];

const TEXTO_VACIO = {
  todos: "Todavía nadie armó un grupo para este show.",
  pre: "Todavía no hay previas armadas.",
  after: "Todavía no hay afters armados.",
  mismo_dia: "Todavía no hay grupos para ir juntos el mismo día.",
};

// "21:00" desde concierto.hora o desde la fecha ("2026-08-28T21:00:00")
function horaDe(concierto) {
  const hora = concierto.hora || String(concierto.fecha || "").slice(11, 16);
  return /^\d{2}:\d{2}/.test(hora) && hora !== "00:00" ? hora.slice(0, 5) : null;
}

function Concierto({ concierto, onAbrirGrupo, onCrearGrupo, onNavegar, onVolver, onVerFansUnidos }) {
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const grupos = concierto?.grupos || [];
  const gruposFiltrados =
    filtroActivo === "todos" ? grupos : grupos.filter((grupo) => grupo.categoria === filtroActivo);
  const cantidades = Object.fromEntries(
    FILTROS.map((f) => [f.id, f.id === "todos" ? grupos.length : grupos.filter((g) => g.categoria === f.id).length])
  );

  const hora = horaDe(concierto);
  const anio = String(concierto.fecha || "").slice(0, 4);

  return (
    <div className="pantalla-concierto">
      <HeaderConcierto concierto={concierto} onVolver={onVolver} />

      <main className="conciertoLayout">
        <section className="conciertoHero">
          <CardEvento concierto={concierto} />
          <TiraTicket
            className="conciertoTira"
            datos={[
              { etiqueta: "Fecha", valor: formatearFechaLarga(concierto.fecha), detalle: anio },
              { etiqueta: "Hora", valor: hora && `${hora} h` },
              { etiqueta: "Lugar", valor: concierto.estadio?.nombre, detalle: concierto.estadio?.ciudad },
            ]}
          />
        </section>

        <section className="conciertoBloque">
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
            <div>
              <h2 className="conciertoBloqueTitulo">Grupos</h2>
              <p className="conciertoBloqueBajada">Previas, afters o para ir juntos: sumate o armá el tuyo.</p>
            </div>
            <FiltroSubEvento
              filtros={FILTROS}
              filtroActivo={filtroActivo}
              onCambiarFiltro={setFiltroActivo}
              cantidades={cantidades}
            />
          </div>

          {gruposFiltrados.length > 0 ? (
            <Carrusel subEventos={gruposFiltrados} onAbrirGrupo={onAbrirGrupo} />
          ) : (
            <div className="conciertoSinGrupos">
              <span className="conciertoSinGruposIcono" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3.2" />
                  <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
                  <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.3c1.8.6 3 2.2 3.4 4.7" />
                </svg>
              </span>
              <p>{TEXTO_VACIO[filtroActivo]}</p>
              <button type="button" className="conciertoSinGruposBoton" onClick={onCrearGrupo}>
                Armar el primero
              </button>
            </div>
          )}

          <button className="btn-crear-grupo fmBotonPrimario" type="button" onClick={onCrearGrupo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Crear grupo para este concierto
          </button>
        </section>
      </main>

      <Footer onNavegar={onNavegar} />
    </div>
  );
}

export default Concierto;
