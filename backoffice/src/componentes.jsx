import { useEffect, useState } from "react";
import { fechaCorta } from "./utilidades";
import imLogo from "./assets/imLogo.png";

// Igual que <Marca /> de la app de fans, con la etiqueta "Backoffice".
export function Marca() {
  return (
    <span className="marca">
      <img className="marcaIcono" src={imLogo} alt="" draggable={false} />
      FanMeet
      <span className="marcaEtiqueta">Backoffice</span>
    </span>
  );
}

// Mismo criterio que TemaContext de la app: data-theme en <html> y la
// preferencia guardada en localStorage con la misma clave.
export function useTema() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.dataset.theme === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = oscuro ? "dark" : "light";
    try {
      localStorage.setItem("fm-theme", oscuro ? "dark" : "light");
    } catch {
      // sin localStorage el tema vale solo para esta visita
    }
  }, [oscuro]);

  return { oscuro, alternar: () => setOscuro((o) => !o) };
}

// Íconos de trazo, mismo estilo que iconosNav.jsx de la app.
function Icono({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const ICONOS = {
  resumen: (
    <Icono>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
    </Icono>
  ),
  reportes: (
    <Icono>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </Icono>
  ),
  usuarios: (
    <Icono>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M4.5 20c.7-4 3.6-6.5 7.5-6.5s6.8 2.5 7.5 6.5" />
    </Icono>
  ),
  conciertos: (
    <Icono>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </Icono>
  ),
  grupos: (
    <Icono>
      <circle cx="8.5" cy="8" r="2.6" />
      <circle cx="16" cy="9" r="2.1" />
      <path d="M3.5 19c.5-3.3 2.5-5 5-5s4.5 1.7 5 5" />
      <path d="M14.8 14.3c2 .2 3.5 1.8 3.9 4.3" />
    </Icono>
  ),
  sol: (
    <Icono>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" />
    </Icono>
  ),
  luna: (
    <Icono>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </Icono>
  ),
  salir: (
    <Icono>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l-4-4 4-4M6 12h10" />
    </Icono>
  ),
};

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
