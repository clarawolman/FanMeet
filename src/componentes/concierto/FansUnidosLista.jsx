import "./FansUnidosLista.css";

function FansUnidosLista({
  fans = [],
  cantidadFans = 0,
  usuarioActualId,
  onVolver,
  onVerUsuario,
  titulo = "Fans unidos",
  subtitulo = `${cantidadFans} personas van a este concierto`,
}) {
  // La lista es para conocer a otros fans: uno mismo no tiene que aparecer ahí.
  const otrosFans = fans.filter((fan) => fan.id_usuario !== usuarioActualId);

  return (
    <div className="fansUnidosLista">
      <header className="fansUnidosListaHeader">
        <button className="fansUnidosListaVolver" type="button" onClick={onVolver}>
          ←
        </button>

        <div>
          <h1>{titulo}</h1>
          <p>{subtitulo}</p>
        </div>
      </header>

      <main className="fansUnidosListaMain">
        {otrosFans.length === 0 && (
          <p className="fansUnidosListaVacio">Todavía no hay nadie más confirmado.</p>
        )}

        {otrosFans.map((fan) => (
          <button
            key={fan.id_usuario}
            className="fanUnidoCard"
            type="button"
            onClick={() => onVerUsuario(fan.id_usuario)}
          >
            <img
              className="fanUnidoFoto"
              src={fan.foto_perfil}
              alt={fan.nombre}
            />
            <span className="fanUnidoNombre">{fan.nombre}</span>
          </button>
        ))}
      </main>
    </div>
  );
}

export default FansUnidosLista;
