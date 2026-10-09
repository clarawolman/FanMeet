// Los generos vienen de afuera (MusicBrainz y Last.fm), cada uno escrito a
// su manera: "Hip-Hop", "hip hop", "hip_hop". Todo se compara por clave
// normalizada.

export function normalizarGenero(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tags que Last.fm usa muchisimo pero no son generos.
const NO_SON_GENEROS = new Set([
  "seen live",
  "favorites",
  "favourite",
  "favorite",
  "favourites",
  "female vocalists",
  "female vocalist",
  "male vocalists",
  "male vocalist",
  "albums i own",
  "beautiful",
  "awesome",
  "love",
  "cool",
]);

export function esTagGenerico(tag) {
  const clave = normalizarGenero(tag);
  return NO_SON_GENEROS.has(clave) || /^\d0s$/.test(clave);
}

// "indie rock" -> "rock", "latin trap" -> "trap", "deep house" -> "house":
// el genero "padre" es la ultima palabra, si es un genero conocido. Sirve
// para el parecido: a alguien de indie rock y a alguien de hard rock les
// gusta lo mismo a medias.
export function familiaDe(claveGenero, vocabulario) {
  const palabras = claveGenero.split(" ");
  if (palabras.length < 2) return null;
  const ultima = palabras[palabras.length - 1];
  return vocabulario.has(ultima) ? ultima : null;
}
