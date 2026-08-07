import "./vibraConcierto.css";

export default function VibraConcierto({
  vibras,
  vibraActual,
  isOwnProfile,
  onSeleccionar,
}) {
  // En un perfil ajeno no se eligen vibras, solo se muestra la elegida:
  // no tiene sentido listar las tres opciones si ninguna es editable.
  const vibrasAMostrar = isOwnProfile
    ? vibras
    : vibras.filter((vibra) => vibra.id === vibraActual);

  if (!isOwnProfile && vibrasAMostrar.length === 0) {
    return (
      <section className="vibraConcierto">
        <h3>Vibe de concierto</h3>
        <p className="vibraConciertoVacio">Todavía no eligió su vibra de concierto.</p>
      </section>
    );
  }

  return (
    <section className="vibraConcierto">
      <h3>{isOwnProfile ? "Tu vibe de concierto" : "Vibe de concierto"}</h3>
      {isOwnProfile && (
        <p className="vibraConciertoSubtitulo">Dónde disfrutás más los shows</p>
      )}

      <div className="vibraConciertoLista">
        {vibrasAMostrar.map((vibra) => {
          const activa = vibra.id === vibraActual;

          return (
            <button
              key={vibra.id}
              type="button"
              className={`vibraOpcion ${activa ? "activo" : ""}`}
              onClick={() => isOwnProfile && onSeleccionar(vibra.id)}
              disabled={!isOwnProfile}
            >
              <span className="vibraOpcionIcono">{vibra.icono}</span>

              <span className="vibraOpcionTexto">
                <strong>{vibra.nombre}</strong>
                <small>{vibra.descripcion}</small>
              </span>

              <span className="vibraOpcionRadio" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
