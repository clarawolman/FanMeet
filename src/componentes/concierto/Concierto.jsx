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

      <main className="conciertoLayout">
        <section className="conciertoHero">
          <CardEvento concierto={concierto} />
        </section>

        <section className="conciertoInfo">
          <CardEstadio estadio={concierto.estadio} />
          <FansUnidos fans={concierto.usuarios} />
        </section>

        <section className="conciertoGrupos">
          <FiltroSubEvento
            filtros={filtros}
            filtroActivo="todos"
            onCambiarFiltro={() => {}}
          />

          <div className="lista-grupos">
            {concierto.grupos.map((grupo) => (
              <SubEventos
                key={grupo.id_grupo}
                subEvento={grupo}
                onAbrirGrupo={onAbrirGrupo}
              />
            ))}
          </div>

          <button className="btn-crear-grupo">CREAR GRUPO ＋</button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Concierto;