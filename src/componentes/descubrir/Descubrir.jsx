import { useEffect, useState } from "react";
import "./Descubrir.css";
import { matchingService } from "../../services/matchingService";
import Footer from "../generales/Footer";
import HeaderApp from "../generales/HeaderApp";
import LoadingSpinner from "../generales/LoadingSpinner";
import AnilloCompatibilidad from "../generales/AnilloCompatibilidad";

// Lo más fuerte que comparten, para la línea de abajo del nombre.
function resumen(fan) {
  if (fan.artistasEnComun.length > 0) {
    return `Escuchan ${fan.artistasEnComun.slice(0, 3).join(", ")}`;
  }
  if (fan.parecidos.length > 0) {
    const { suyo, tuyo } = fan.parecidos[0];
    return `Escucha a ${suyo}, parecido a ${tuyo}`;
  }
  if (fan.generosEnComun.length > 0) {
    return `Les gusta ${fan.generosEnComun.slice(0, 3).join(", ")}`;
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
      <HeaderApp titulo="Descubrir" subtitulo="Fans con gustos parecidos a los tuyos" />

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
          <p className="descubrirMensaje">Todavía no hay fans con gustos parecidos a los tuyos.</p>
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

                    {fan.generosEnComun.length > 0 && (
                      <div className="descubrirCardGeneros">
                        {fan.generosEnComun.slice(0, 3).map((genero) => (
                          <span key={genero}>{genero}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="descubrirCardBoton"
                    onClick={() => onVerUsuario(fan.id_usuario)}
                  >
                    Ver perfil
                  </button>
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
