// Spotify devuelve las imagenes de mayor a menor (640, 300, 64 px).
// Nos quedamos con la mediana: alcanza para cards y no pesa tanto.
function imagenMediana(imagenes) {
  if (!Array.isArray(imagenes) || imagenes.length === 0) return null;
  return (imagenes[1] || imagenes[0]).url;
}

export function toArtistaSpotify(artista) {
  if (!artista) return null;
  return {
    spotify_id: artista.id,
    nombre: artista.name,
    imagen: imagenMediana(artista.images),
    url: artista.external_urls?.spotify || `https://open.spotify.com/artist/${artista.id}`,
  };
}

export function toAlbumSpotify(album) {
  if (!album) return null;
  return {
    spotify_id: album.id,
    nombre: album.name,
    imagen: imagenMediana(album.images),
    artistas: (album.artists || []).map((a) => a.name),
    anio: album.release_date ? album.release_date.slice(0, 4) : null,
    url: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
  };
}

export function toCancionSpotify(cancion) {
  if (!cancion) return null;
  return {
    spotify_id: cancion.id,
    nombre: cancion.name,
    imagen: imagenMediana(cancion.album?.images),
    artistas: (cancion.artists || []).map((a) => a.name),
    album: cancion.album?.name || null,
    url: cancion.external_urls?.spotify || `https://open.spotify.com/track/${cancion.id}`,
  };
}

export function toArtistaFavorito(row) {
  if (!row) return null;
  return {
    spotify_id: row.spotify_id,
    nombre: row.nombre,
    imagen: row.imagen,
    url: `https://open.spotify.com/artist/${row.spotify_id}`,
  };
}
