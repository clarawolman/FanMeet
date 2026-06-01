import "./Concierto.css";

import HeaderConcierto from "./HeaderConcierto";
import CardEvento from "./CardEvento";
import CardEstadio from "./CardEstadio";
import FansUnidos from "./FansUnidos";
import FiltroSubEvento from "./FiltroSubEvento";
import SubEventos from "./SubEventos";
import Footer from "./Footer";

function Concierto({ concierto, onAbrirGrupo }) {
  const filtros = [
    { id: "todos", nombre: "Todos" },
    { id: "pre", nombre: "Pre" },
    { id: "after", nombre: "After" },
  ];

  return (
    <div className="pantalla-concierto">
      <HeaderConcierto concierto={concierto} />

      <CardEvento concierto={concierto} />

      <CardEstadio estadio={concierto.estadio} />

      <FansUnidos fans={concierto.usuarios} />

      <FiltroSubEvento
        filtros={filtros}
        filtroActivo="todos"
        onCambiarFiltro={() => {}}
      />

      <section className="lista-grupos">
        {concierto.grupos.map((grupo) => (
          <SubEventos
            key={grupo.id_grupo}
            subEvento={grupo}
            onAbrirGrupo={onAbrirGrupo}
          />
        ))}
      </section>

      <button className="btn-crear-grupo">CREAR GRUPO ＋</button>

      <Footer />
    </div>
  );
}

export default Concierto;