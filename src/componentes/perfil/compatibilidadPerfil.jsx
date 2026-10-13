import { useEffect, useState } from "react";
import { matchingService } from "../../services/matchingService";
import AnilloCompatibilidad from "../generales/AnilloCompatibilidad";
import "./compatibilidadPerfil.css";

function frase(porcentaje) {
  if (porcentaje >= 80) return "Tienen gustos muy parecidos";
  if (porcentaje >= 60) return "Comparten bastante música";
  if (porcentaje >= 35) return "Tienen algunas cosas en común";
  return "Escuchan cosas bastante distintas";
}

// Qué tan compatibles son tus gustos con los de este perfil ajeno.
export default function CompatibilidadPerfil({ idUsuario, nombre }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    matchingService
      .compatibilidadCon(idUsuario)
      .then((resultado) => !cancelado && setDatos(resultado))
      .catch((err) => console.error("Error calculando compatibilidad:", err))
      .finally(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  if (cargando) {
    return (
      <section className="compatibilidadPerfil cargando">
        <p className="compatibilidadPerfilVacio">Comparando gustos…</p>
      </section>
    );
  }

  if (!datos) return null;

  if (datos.porcentaje == null) {
    return (
      <section className="compatibilidadPerfil">
        <p className="compatibilidadPerfilVacio">
          Todavía no hay suficientes gustos cargados para calcular la compatibilidad. Sumá
          artistas o géneros al perfil, o vinculá Last.fm.
        </p>
      </section>
    );
  }

  const { porcentaje, artistasEnComun, generosEnComun, parecidos, conciertosEnComun, mismaVibra } =
    datos;

  return (
    <section className="compatibilidadPerfil">
      <div className="compatibilidadPerfilResumen">
        <AnilloCompatibilidad porcentaje={porcentaje} tamano={72} />
        <div>
          <h3>Compatibilidad musical</h3>
          <p>
            {frase(porcentaje)} con {nombre}.
          </p>
        </div>
      </div>

      {artistasEnComun.length > 0 && (
        <div className="compatibilidadPerfilGrupo">
          <h4>Artistas en común</h4>
          <div className="compatibilidadPerfilChips">
            {artistasEnComun.map((artista) => (
              <span key={artista}>{artista}</span>
            ))}
          </div>
        </div>
      )}

      {generosEnComun.length > 0 && (
        <div className="compatibilidadPerfilGrupo">
          <h4>Géneros en común</h4>
          <div className="compatibilidadPerfilChips">
            {generosEnComun.map((genero) => (
              <span key={genero} className="genero">
                {genero}
              </span>
            ))}
          </div>
        </div>
      )}

      {(parecidos.length > 0 || conciertosEnComun > 0 || mismaVibra) && (
        <ul className="compatibilidadPerfilDatos">
          {parecidos.map(({ suyo, tuyo }) => (
            <li key={suyo}>
              Escucha a <strong>{suyo}</strong>, parecido a <strong>{tuyo}</strong>
            </li>
          ))}
          {conciertosEnComun > 0 && (
            <li>
              Van a{" "}
              <strong>
                {conciertosEnComun} {conciertosEnComun === 1 ? "concierto" : "conciertos"}
              </strong>{" "}
              en común
            </li>
          )}
          {mismaVibra && <li>Viven los conciertos igual que vos</li>}
        </ul>
      )}
    </section>
  );
}
