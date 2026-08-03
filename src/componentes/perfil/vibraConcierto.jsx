import "./vibraConcierto.css";

export default function VibraConcierto({
  vibras,
  vibraActual,
  isOwnProfile,
  onSeleccionar,
}) {
  return (
    <section className="vibraConcierto">
      <h3>Tu vibe de concierto</h3>
      <p className="vibraConciertoSubtitulo">Dónde disfrutás más los shows</p>

      <div className="vibraConciertoLista">
        {vibras.map((vibra) => {
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
