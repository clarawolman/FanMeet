import { fechaCorta } from "./utilidades";

const TEXTOS_ESTADO = {
  activo: "Activo",
  suspendido: "Suspendido",
  pendiente: "Pendiente",
  sancionado: "Sancionado",
  descartado: "Descartado",
};

export function Estado({ valor }) {
  return <span className={`estado estado-${valor}`}>{TEXTOS_ESTADO[valor] || valor}</span>;
}

export function Cargando({ error, cargando, children }) {
  if (error) return <p className="mensajeError">{error}</p>;
  if (cargando) return <p className="textoSuave">Cargando…</p>;
  return children;
}

export function Avatar({ usuario }) {
  return (
    <img
      className="avatar"
      src={usuario?.fotoperfil || "/Favicon.png"}
      alt=""
      onError={(e) => {
        e.currentTarget.src = "/Favicon.png";
      }}
    />
  );
}

// Lista de mensajes de un chat. `destacado` resalta los de esa persona
// (el usuario reportado).
export function Conversacion({ mensajes, destacado }) {
  if (mensajes.length === 0) return <p className="textoSuave">No hay mensajes.</p>;
  return (
    <ol className="conversacion">
      {mensajes.map((m) => (
        <li key={m.id_mensaje} className={m.autor.id_usuario === destacado ? "deReportado" : ""}>
          <Avatar usuario={m.autor} />
          <div>
            <div className="mensajeCabecera">
              <strong>{m.autor.nombre}</strong>
              <span className="textoSuave">{fechaCorta(m.created_at)}</span>
            </div>
            {m.contenido && <p>{m.contenido}</p>}
            {m.imagen && <img className="mensajeImagen" src={m.imagen} alt="Imagen enviada" />}
          </div>
        </li>
      ))}
    </ol>
  );
}
