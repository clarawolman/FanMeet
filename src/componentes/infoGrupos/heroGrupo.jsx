import "./heroGrupo.css";

const CATEGORIAS = { pre: "Previa", after: "After", mismo_dia: "El mismo día" };

// Foto del grupo a sangre con la categoría, el nombre y de qué concierto es.
export default function HeroGrupo({ grupo, concierto }) {
  const nombreConcierto = concierto?.nombre || grupo.concierto?.nombre;

  return (
    <div className="heroGrupo">
      <div className="heroImageContainer">
        <img src={grupo.foto} alt="" />
      </div>

      {CATEGORIAS[grupo.categoria] && <span className="heroGrupoCategoria">{CATEGORIAS[grupo.categoria]}</span>}

      <div className="heroGrupoTexto">
        {nombreConcierto && <p className="heroGrupoConcierto">{nombreConcierto}</p>}
        <h1>{grupo.nombre}</h1>
      </div>
    </div>
  );
}
