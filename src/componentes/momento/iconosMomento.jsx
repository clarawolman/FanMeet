// Íconos de las publicaciones (momentos), mismo trazo que iconosNav.
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function IconoCorazon({ lleno = false, ...props }) {
  return (
    <svg {...base} fill={lleno ? "currentColor" : "none"} {...props}>
      <path d="M12 20.5s-7.5-4.6-9.3-9.1C1.5 8.3 3.5 4.5 7.2 4.5c2.1 0 3.6 1.2 4.8 2.9 1.2-1.7 2.7-2.9 4.8-2.9 3.7 0 5.7 3.8 4.5 6.9-1.8 4.5-9.3 9.1-9.3 9.1z" />
    </svg>
  );
}

export function IconoComentario(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.5-4.4A8.4 8.4 0 1 1 20.5 11.6z" />
    </svg>
  );
}

export function IconoEnviar(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21.5 3 10.2 14.3" />
      <path d="M21.5 3 14.6 21l-4.4-6.7L3.5 9.9z" />
    </svg>
  );
}

export function IconoGuardar({ lleno = false, ...props }) {
  return (
    <svg {...base} fill={lleno ? "currentColor" : "none"} {...props}>
      <path d="M19 21l-7-5-7 5V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5z" />
    </svg>
  );
}

export function IconoCarrusel(props) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="7" width="13.5" height="13.5" rx="2.5" />
      <path d="M16.5 3.5H6A2.5 2.5 0 0 0 3.5 6v10.5" />
    </svg>
  );
}

export function IconoFijado({ lleno = false, ...props }) {
  return (
    <svg {...base} fill={lleno ? "currentColor" : "none"} {...props}>
      <path d="M15 3.5l5.5 5.5-3 1.2-3.6 3.6.4 4.2-1.8 1.8-3.4-3.4-4.6 4.6M8.7 11.3 5.3 7.9l1.8-1.8 4.2.4 3.6-3.6z" />
    </svg>
  );
}

export function IconoMas(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconoUbicacion(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function IconoGrilla(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" />
    </svg>
  );
}
