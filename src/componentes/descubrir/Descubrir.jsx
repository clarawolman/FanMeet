import { useEffect, useState } from "react";
import "./Descubrir.css";
import { matchingService } from "../../services/matchingService";
import Footer from "../generales/Footer";
import HeaderApp from "../generales/HeaderApp";
import LoadingSpinner from "../generales/LoadingSpinner";
import AnilloCompatibilidad from "../generales/AnilloCompatibilidad";
import BotonConectar from "../generales/BotonConectar";
import Buscador from "../generales/Buscador";
import { IconoSiguiente } from "../generales/iconosNav";
import { usuariosService } from "../../services/usuariosService";

// Línea de abajo del nombre: "Le gusta Duki, Khea". Primero los artistas
// en común; si no comparten ninguno, los géneros en común.
function resumen(fan) {
  if (fan.artistasEnComun.length > 0) {
    return `Le gusta ${fan.artistasEnComun.slice(0, 3).join(", ")}`;
  }
  if (fan.generosEnComun.length > 0) {
    return `Le gusta ${fan.generosEnComun.slice(0, 3).join(", ")}`;
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
  const [busqueda, setBusqueda] = useState("");
  // Última respuesta del buscador y el texto al que corresponde
  const [respuesta, setRespuesta] = useState({ texto: "", usuarios: [] });

  useEffect(() => {
    matchingService
      .descubrir()
      .then(setDatos)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  // Buscador de perfiles: espera a que se deje de tipear y descarta
  // respuestas viejas si el texto cambió mientras tanto.
  const textoBuscado = busqueda.trim();
  const hayBusqueda = textoBuscado.length > 0;
  const busquedaValida = textoBuscado.length >= 2;

  useEffect(() => {
    if (textoBuscado.length < 2) return;

    let cancelado = false;
    const espera = setTimeout(() => {
      usuariosService
        .buscar(textoBuscado)
        .catch(() => [])
        .then((usuarios) => {
          if (!cancelado) setRespuesta({ texto: textoBuscado, usuarios: usuarios || [] });
        });
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [textoBuscado]);

  // Mientras llega la respuesta del texto nuevo se siguen mostrando los
  // resultados anteriores.
  const buscando = busquedaValida && respuesta.texto !== textoBuscado;
  const resultados = busquedaValida && (respuesta.texto || !buscando) ? respuesta.usuarios : null;

  const fans = datos?.fans || [];

  return (
    <div className="pantallaDescubrir">
      <HeaderApp titulo="Descubrir" subtitulo="Fans con gustos similares a los tuyos" />

      <main className="descubrirLayout">
        <Buscador
          className="descubrirBuscador"
          valor={busqueda}
          onCambiar={setBusqueda}
          etiqueta="Buscar perfiles"
          placeholder="Buscar por nombre o @usuario"
        />

        {hayBusqueda && (
          <section className="descubrirResultados" aria-live="polite">
            {!busquedaValida && (
              <p className="descubrirResultadosEstado">Escribí al menos 2 letras.</p>
            )}

            {resultados === null && buscando && <LoadingSpinner texto="Buscando…" />}

            {resultados?.length === 0 && !buscando && (
              <p className="descubrirResultadosEstado">No encontramos a nadie con ese nombre.</p>
            )}

            {resultados?.length > 0 && (
              <ul className="descubrirResultadosLista">
                {resultados.map((usuario) => (
                  <li key={usuario.id_usuario}>
                    <button
                      type="button"
                      className="descubrirResultado"
                      onClick={() => onVerUsuario(usuario.id_usuario)}
                    >
                      <img className="descubrirResultadoFoto" src={usuario.foto_perfil} alt="" />
                      <span className="descubrirResultadoInfo">
                        <strong>
                          {usuario.apodo || usuario.nombre}
                          {usuario.edad != null && <small>, {usuario.edad}</small>}
                        </strong>
                        <small>@{usuario.nombre}</small>
                      </span>
                      <IconoSiguiente width="14" height="14" className="descubrirResultadoFlecha" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!hayBusqueda && cargando && <LoadingSpinner texto="Comparando gustos…" />}

        {!hayBusqueda && !cargando && error && <p className="descubrirMensaje">{error}</p>}

        {!hayBusqueda && !cargando && !error && datos && !datos.perfilCompleto && (
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

        {!hayBusqueda && !cargando && !error && datos?.perfilCompleto && fans.length === 0 && (
          <p className="descubrirMensaje">
            Todavía no hay otros fans con gustos cargados para comparar.
          </p>
        )}

        {!hayBusqueda && datos?.soloCercanos && fans.length > 0 && (
          <p className="descubrirAviso">
            Nadie llega al 40% de compatibilidad todavía, así que te mostramos a los más
            parecidos a vos. Sumá más artistas y géneros en tu perfil para encontrar más gente.
          </p>
        )}

        {!hayBusqueda && fans.length > 0 && (
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
                    {fan.mismaCiudad && <span className="descubrirCardCiudad">En tu ciudad</span>}
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
