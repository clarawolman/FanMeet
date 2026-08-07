// Set chico de íconos por género, matcheando por palabra clave del nombre.
// Si no reconocemos el género devolvemos una nota musical genérica.
function quitarAcentos(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function IconoNota() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="15" r="2.4" />
      <circle cx="14" cy="13.5" r="2.4" />
      <path d="M8.4 15V5.5L16.4 4v9.5" />
    </svg>
  );
}

function IconoRayo() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2.5 4.5 11.5h4.2L8.2 17.5l7.3-9.6h-4.3z" />
    </svg>
  );
}

function IconoVinilo() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.2" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

function IconoEcualizador() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 14V9M10 16V4M15 14v-4" />
    </svg>
  );
}

function IconoMicrofono() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7.3" y="2.5" width="5.4" height="9" rx="2.7" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5M7 17.5h6" />
    </svg>
  );
}

const MAPA_ICONOS = [
  { claves: ["pop"], Icono: IconoNota },
  { claves: ["rock", "metal", "punk"], Icono: IconoRayo },
  { claves: ["jazz", "clasica", "classic", "blues"], Icono: IconoVinilo },
  { claves: ["indie", "electr", "house", "techno"], Icono: IconoEcualizador },
  { claves: ["urbano", "trap", "reggaeton", "hip hop", "rap"], Icono: IconoMicrofono },
];

export default function IconoGenero({ nombre }) {
  const nombreNormalizado = quitarAcentos(nombre || "");
  const encontrado = MAPA_ICONOS.find((entrada) =>
    entrada.claves.some((clave) => nombreNormalizado.includes(clave))
  );

  const Icono = encontrado?.Icono || IconoNota;

  return <Icono />;
}
