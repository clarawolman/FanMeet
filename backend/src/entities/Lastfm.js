// Desde 2019 Last.fm devuelve esta estrella gris en vez de fotos de
// artistas (y de muchas canciones). La tratamos como "sin imagen".
const PLACEHOLDER_LASTFM = "2a96cbd8b46e442fc41c2b86b821562f";

// Last.fm devuelve un objeto suelto (no array) cuando hay un solo resultado.
export function comoLista(valor) {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

function imagenLastfm(imagenes) {
  const url = comoLista(imagenes)
    .map((imagen) => imagen["#text"])
    .filter((texto) => texto && !texto.includes(PLACEHOLDER_LASTFM))
    .pop();
  return url || null;
}

function nombreArtista(artista) {
  if (!artista) return "";
  return typeof artista === "string" ? artista : artista.name || artista["#text"] || "";
}

export function toArtistaLastfm(artista) {
  return {
    nombre: artista.name,
    reproducciones: Number(artista.playcount) || 0,
    imagen: imagenLastfm(artista.image),
    url: artista.url,
  };
}

export function toCancionLastfm(cancion) {
  return {
    nombre: cancion.name,
    artistas: [nombreArtista(cancion.artist)].filter(Boolean),
    album: cancion.album?.["#text"] || null,
    reproducciones: Number(cancion.playcount) || 0,
    imagen: imagenLastfm(cancion.image),
    url: cancion.url,
  };
}

export function toAlbumLastfm(album) {
  return {
    nombre: album.name,
    artistas: [nombreArtista(album.artist)].filter(Boolean),
    reproducciones: Number(album.playcount) || 0,
    imagen: imagenLastfm(album.image),
    url: album.url,
  };
}

export function toEscuchaReciente(cancion) {
  const sonandoAhora = cancion["@attr"]?.nowplaying === "true";
  return {
    ...toCancionLastfm(cancion),
    sonando_ahora: sonandoAhora,
    escuchado_at:
      !sonandoAhora && cancion.date?.uts
        ? new Date(Number(cancion.date.uts) * 1000).toISOString()
        : null,
  };
}
