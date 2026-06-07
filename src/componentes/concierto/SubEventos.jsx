import "./SubEventos.css";

function SubEventos({ subEvento, onAbrirGrupo }) {
  return (
    <section className="SubEventoCard">
      <div className="SubEventoContenido">
        <h3 className="SubEventoTitulo">{subEvento.nombre}</h3>

        <p className="SubEventoInfo">
          {subEvento.ubicacion} - {subEvento.fecha}
        </p>

        <div className="SubEventoUsuarios">
          <div className="SubEventoAvatares">
            {subEvento.usuarios.slice(0, 3).map((usuario) => (
              <img
                key={usuario.id_usuario}
                className="SubEventoAvatar"
                src={usuario.fotoperfil || "https://i.pinimg.com/originals/31/ec/2c/31ec2ce212492e600b8de27f38846ed7.jpg"}
                alt={usuario.nombre}
              />
            ))}
          </div>

          {subEvento.usuarios.length > 3 && (
            <span className="SubEventoExtra">
              +{subEvento.usuarios.length - 3}
            </span>
          )}
        </div>

        <p className="SubEventoAsistiran">
          {subEvento.usuarios.length} personas asistirán
        </p>

        <button
  className="SubEventoBoton"
  onClick={() => onAbrirGrupo(subEvento)}
>
  VER MÁS
</button>
      </div>
    </section>
  );
}

export default SubEventos;