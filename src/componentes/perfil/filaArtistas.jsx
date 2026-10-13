import CarruselFila from "../home/CarruselFila";
import "./filaArtistas.css";

// Fila horizontal de artistas en círculo, como la sección "Fans también
// escuchan" del perfil de un artista en Spotify. Con `cuadrado` sirve
// también para tapas de álbumes. Con `sinLink` no abre ninguna página
// externa (lo de Last.fm se muestra solo en el perfil).
export default function FilaArtistas({
  artistas,
  obtenerSubtitulo = () => "Artista",
  cuadrado = false,
  sinLink = false,
  onQuitar,
  alInicio,
}) {
  // Mismo contenido, como link o como bloque fijo.
  const Contenedor = sinLink ? "div" : "a";

  return (
    <div className={`filaArtistas ${cuadrado ? "cuadrado" : ""}`}>
      <CarruselFila>
        {alInicio}

        {artistas.map((artista, indice) => (
          <div className="artistaCirculo" key={artista.spotify_id || artista.url || artista.nombre}>
            <Contenedor
              className={`artistaCirculoLink ${sinLink ? "artistaCirculoLink--fijo" : ""}`}
              {...(sinLink
                ? {}
                : { href: artista.url, target: "_blank", rel: "noopener noreferrer", draggable: false })}
            >
              {artista.imagen ? (
                <img className="artistaCirculoImagen" src={artista.imagen} alt={artista.nombre} />
              ) : (
                <span className="artistaCirculoImagen artistaCirculoInicial" aria-hidden="true">
                  {artista.nombre?.[0]?.toUpperCase() || "?"}
                </span>
              )}

              <strong>{artista.nombre}</strong>
              <small>{obtenerSubtitulo(artista, indice)}</small>
            </Contenedor>

            {onQuitar && (
              <button
                className="artistaCirculoQuitar"
                type="button"
                onClick={() => onQuitar(artista)}
                aria-label={`Quitar a ${artista.nombre} de favoritos`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </CarruselFila>
    </div>
  );
}
