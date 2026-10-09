import { useEffect, useState } from "react";
import { lastfmService } from "../../services/lastfmService";
import IconoLastfm from "./iconoLastfm";
import "./resumenLastfmPerfil.css";

function formatearNumero(numero) {
  return Number(numero || 0).toLocaleString("es-AR");
}

// Tarjeta corta arriba del perfil con lo que escucha en Last.fm. Si no
// tiene Last.fm vinculado (o falla), no se muestra nada.
export default function ResumenLastfmPerfil({ idUsuario, isOwnProfile }) {
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    let cancelado = false;

    lastfmService
      .obtenerResumen(idUsuario)
      .then((datos) => !cancelado && setResumen(datos))
      .catch((error) => console.error("Error cargando resumen de Last.fm:", error));

    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  if (!resumen?.conectado || !resumen.artistaTop) return null;

  const { artistaTop, otrosArtistas, generos, total_reproducciones, periodo } = resumen;
  const cuando = periodo === "mes" ? "este mes" : "de siempre";

  return (
    <section className="resumenLastfm">
      <a
        className="resumenLastfmArtista"
        href={artistaTop.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {artistaTop.imagen ? (
          <img src={artistaTop.imagen} alt="" />
        ) : (
          <span className="resumenLastfmInicial" aria-hidden="true">
            {artistaTop.nombre[0]?.toUpperCase()}
          </span>
        )}
      </a>

      <div className="resumenLastfmTexto">
        <p className="resumenLastfmEtiqueta">
          {isOwnProfile ? "Lo que más escuchás" : "Lo que más escucha"} {cuando}
        </p>
        <h3>{artistaTop.nombre}</h3>
        {otrosArtistas.length > 0 && (
          <p className="resumenLastfmOtros">y también {otrosArtistas.join(", ")}</p>
        )}

        {generos.length > 0 && (
          <div className="resumenLastfmGeneros">
            {generos.map((genero) => (
              <span key={genero}>{genero}</span>
            ))}
          </div>
        )}

        <p className="resumenLastfmTotal">
          <IconoLastfm size={13} /> {formatearNumero(total_reproducciones)} reproducciones en
          Last.fm
        </p>
      </div>
    </section>
  );
}
