import "./CardGrupo.css";

function CardGrupo({ grupo, onAbrirGrupo }) {
  const usuarios = grupo.usuarios || [];

  const mostrarUsuarios = usuarios.slice(0, 3);
  const restantes = usuarios.length - 3;

  function obtenerEstado() {
    const hoy = new Date();
    const fechaGrupo = new Date(grupo.fecha);

    const diferencia =
      Math.ceil((fechaGrupo - hoy) / (1000 * 60 * 60 * 24));

    if (diferencia <= 0) return "AHORA";
    if (diferencia === 1) return "Mañana";
    return `Empieza en ${diferencia} días`;
  }

  return (
    <article className="cardGrupo">

      <div className="lineaVioleta" />

      <div className="contenidoGrupo">

        <div className="grupoSuperior">

          <div className="categoriaGrupo">
            {grupo.categoria === "pre" && "🎉"}
            {grupo.categoria === "after" && "🍻"}
            {grupo.categoria === "mismo_dia" && "🎵"}
          </div>

          <span className="estadoGrupo">
            {obtenerEstado()}
          </span>

        </div>

        <h3>{grupo.nombre}</h3>

        <div className="datoGrupo">
          📍 {grupo.ubicacion}
        </div>

        <div className="datoGrupo">
          📅 {grupo.fecha} - {grupo.hora}
        </div>

        <div className="grupoInferior">

          <div className="usuariosGrupo">

            {mostrarUsuarios.map((usuario) => (
              <img
                key={usuario.id_usuario}
                src={usuario.foto_perfil}
                alt={usuario.nombre}
                className="avatarGrupo"
              />
            ))}

            {restantes > 0 && (
              <span className="masUsuarios">
                +{restantes}
              </span>
            )}

          </div>

          <button
            className="btnVerMas"
            onClick={() => onAbrirGrupo(grupo)}
          >
            Ver más →
          </button>

        </div>

      </div>

    </article>
  );
}

export default CardGrupo;