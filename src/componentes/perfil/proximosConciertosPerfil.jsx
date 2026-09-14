import "./proximosConciertosPerfil.css";

const MAX_VISIBLES = 3;

function formatearFecha(fecha) {
  if (!fecha) return "Fecha a confirmar";

  const fechaObjeto = new Date(fecha);
  if (Number.isNaN(fechaObjeto.getTime())) return "Fecha a confirmar";

  return fechaObjeto.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default function ProximosConciertosPerfil({
  eventos,
  cargando,
  onVerConcierto,
  onVerTodos,
  onDescubrir,
}) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximos = (eventos || [])
    .filter((evento) => {
      if (!evento.fecha) return false;
      const fechaEvento = new Date(evento.fecha);
      return !Number.isNaN(fechaEvento.getTime()) && fechaEvento >= hoy;
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const visibles = proximos.slice(0, MAX_VISIBLES);

  return (
    <section className="proximosConciertosPerfil">
      <div className="proximosConciertosPerfilHeader">
        <h3>Próximos conciertos</h3>

        {proximos.length > MAX_VISIBLES && (
          <button
            className="proximosConciertosPerfilVerTodos"
            type="button"
            onClick={onVerTodos}
          >
            Ver todos
          </button>
        )}
      </div>

      {!cargando && visibles.length === 0 && (
        <div className="proximosConciertosPerfilVacio">
          <p>Todavía no tenés conciertos próximos.</p>

          <button
            className="proximosConciertosPerfilDescubrir"
            type="button"
            onClick={onDescubrir}
          >
            Descubrir conciertos
          </button>
        </div>
      )}

      {visibles.length > 0 && (
        <div className="proximosConciertosPerfilLista">
          {visibles.map((evento) => {
            const artista = evento.artista?.nombre || evento.nombre || "Artista";
            const lugar = evento.estadio?.nombre || evento.estadio?.ciudad || "";

            return (
              <button
                key={evento.id_concierto}
                className="proximoConciertoItem"
                type="button"
                onClick={() => onVerConcierto(evento)}
              >
                <img
                  className="proximoConciertoImagen"
                  src={evento.imagen || evento.imagenConcierto || evento.foto || ""}
                  alt={artista}
                />

                <span className="proximoConciertoInfo">
                  <strong>{artista}</strong>
                  <small>
                    {formatearFecha(evento.fecha)}
                    {lugar ? ` · ${lugar}` : ""}
                  </small>
                </span>

                <span className="proximoConciertoFlecha">›</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
