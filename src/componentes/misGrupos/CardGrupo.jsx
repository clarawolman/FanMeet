import "./CardGrupo.css";

function CardGrupo({ grupo, onAbrirGrupo, onSalir }) {
  const usuarios = grupo.usuarios || [];

  const mostrarUsuarios = usuarios.slice(0, 3);
  const restantes = usuarios.length - 3;

  const categoriaTexto =
    grupo.categoria === "pre"
      ? "Pre-show"
      : grupo.categoria === "after"
      ? "After"
      : grupo.categoria === "mismo_dia"
      ? "Mismo día"
      : "Grupo";

  const horaFormateada = grupo.hora ? String(grupo.hora).slice(0, 5) : "";

  function obtenerEstado() {
    const hoy = new Date();
    const fechaGrupo = new Date(grupo.fecha);

    const diferencia = Math.ceil(
      (fechaGrupo - hoy) / (1000 * 60 * 60 * 24)
    );

    if (diferencia <= 0) return "AHORA";
    if (diferencia === 1) return "Mañana";
    return `Empieza en ${diferencia} días`;
  }

  return (
    <article className="cardGrupo">
      <div className="cardGrupoInfo">
        <div className="cardGrupoEtiqueta">
          <span className="estadoGrupo">{obtenerEstado()}</span>
          <span className="categoriaTextoGrupo">{categoriaTexto}</span>
        </div>

        <h2>{grupo.nombre}</h2>

        <div className="cardGrupoMeta">
          <span>{grupo.ubicacion}</span>
          <span>
            {grupo.fecha}
            {horaFormateada && ` - ${horaFormateada}`}
          </span>
        </div>

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
            <span className="masUsuarios">+{restantes}</span>
          )}
        </div>
      </div>

      <div className="cardGrupoAcciones">
        {onSalir && (
          <button
            className="btnSalirGrupo"
            type="button"
            onClick={() => onSalir(grupo)}
          >
            Salir
          </button>
        )}

        <button
          className="btnVerMasGrupo"
          onClick={() => onAbrirGrupo(grupo)}
        >
          Ver más
        </button>
      </div>
    </article>
  );
}

export default CardGrupo;