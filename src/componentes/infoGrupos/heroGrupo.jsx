import "./heroGrupo.css";

const CATEGORIAS = { pre: "Previa", after: "After", mismo_dia: "El mismo día", comunidad: "Comunidad" };

// Misma foto por defecto que CardGrupo (misGrupos) y SubEventos.
const FOTO_GRUPO_DEFAULT = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80";

// Foto del grupo a sangre con la categoría, el nombre y de qué concierto es.
export default function HeroGrupo({ grupo, concierto }) {
  const nombreConcierto = concierto?.nombre || grupo.concierto?.nombre;
  // Los grupos creados desde el backoffice pueden no tener foto: se usa la
  // del concierto (src="" hace que el navegador vuelva a pedir la página).
  const foto = grupo.foto || concierto?.imagen || FOTO_GRUPO_DEFAULT;
  // Grupo general: es de todas las fechas seguidas del show.
  const cantidadFechas = grupo.ids_conciertos?.length || 1;

  return (
    <div className="heroGrupo">
      <div className="heroImageContainer">
        <img src={foto} alt="" />
      </div>

      {CATEGORIAS[grupo.categoria] && <span className="heroGrupoCategoria">{CATEGORIAS[grupo.categoria]}</span>}

      <div className="heroGrupoTexto">
        {nombreConcierto && (
          <p className="heroGrupoConcierto">
            {nombreConcierto}
            {cantidadFechas > 1 && ` · las ${cantidadFechas} fechas`}
          </p>
        )}
        <h1>{grupo.nombre}</h1>
      </div>
    </div>
  );
}
