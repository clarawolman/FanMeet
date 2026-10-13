import { useEffect, useState } from "react";
import "./Descubrir.css";
import { matchingService } from "../../services/matchingService";
import Footer from "../generales/Footer";
import HeaderApp from "../generales/HeaderApp";
import LoadingSpinner from "../generales/LoadingSpinner";
import AnilloCompatibilidad from "../generales/AnilloCompatibilidad";
import BotonConectar from "../generales/BotonConectar";

// Línea de abajo del nombre: "Le gusta rock, indie". Si no comparten
// géneros con nombre, se usa lo más fuerte que tengan en común.
function resumen(fan) {
  if (fan.generosEnComun.length > 0) {
    return `Le gusta ${fan.generosEnComun.slice(0, 3).join(", ")}`;
  }
  if (fan.artistasEnComun.length > 0) {
    return `Le gusta ${fan.artistasEnComun.slice(0, 3).join(", ")}`;
  }
  if (fan.parecidos.length > 0) {
    return `Le gusta ${fan.parecidos[0].suyo}`;
  }
  return "Gustos parecidos";
}

// Fans ordenados por compatibilidad musical con el usuario logueado.
export default function Descubrir({ onNavegar, onVerUsuario }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    matchingService
      .descubrir()
      .then(setDatos)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  const fans = datos?.fans || [];

  return (
    <div className="pantallaDescubrir">
      <HeaderApp titulo="Descubrir" subtitulo="Fans con 60% o más de compatibilidad con vos" />

      <main className="descubrirLayout">
        {cargando && <LoadingSpinner texto="Comparando gustos…" />}

        {!cargando && error && <p className="descubrirMensaje">{error}</p>}

        {!cargando && !error && datos && !datos.perfilCompleto && (
          <div className="descubrirMensaje">
            <p>
              Para encontrar fans parecidos a vos, sumá tus artistas favoritos y géneros en tu
              perfil, o vinculá tu cuenta de Last.fm.
            </p>
            <button type="button" className="descubrirBoton" onClick={() => onNavegar("perfil")}>
              Completar mi perfil
            </button>
          </div>
        )}

        {!cargando && !error && datos?.perfilCompleto && fans.length === 0 && (
          <p className="descubrirMensaje">
            Todavía no hay otros fans con gustos cargados para comparar.
          </p>
        )}

        {datos?.soloCercanos && fans.length > 0 && (
          <p className="descubrirAviso">
            Nadie llega al 60% de compatibilidad todavía, así que te mostramos a los más
            parecidos a vos. Sumá más artistas y géneros en tu perfil para encontrar más gente.
          </p>
        )}

        {fans.length > 0 && (
          <ul className="descubrirGrilla">
            {fans.map((fan) => (
              <li key={fan.id_usuario}>
                <article className="descubrirCard">
                  <button
                    type="button"
                    className="descubrirCardFotoBoton"
                    onClick={() => onVerUsuario(fan.id_usuario)}
                    aria-label={`Ver el perfil de ${fan.nombre}`}
                  >
                    <img className="descubrirCardFoto" src={fan.foto_perfil} alt="" />
                    <span className="descubrirCardPorcentaje">
                      <AnilloCompatibilidad porcentaje={fan.porcentaje} tamano={50} />
                    </span>
                  </button>

                  <div className="descubrirCardInfo">
                    <h3>
                      {fan.nombre}
                      {fan.edad != null && <small>, {fan.edad}</small>}
                    </h3>
                    <p className="descubrirCardResumen">{resumen(fan)}</p>
                  </div>

                  <BotonConectar fan={fan} className="descubrirCardBoton" />
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer onNavegar={onNavegar} pantallaActiva="descubrir" />
    </div>
  );
}
