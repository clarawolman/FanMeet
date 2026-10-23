import { useState } from "react";
import "./AccionFani.css";
import { formatearFechaLarga } from "../../utils/fechas";
import { IconoCalendario, IconoReloj, IconoUbicacion } from "../generales/iconosTarjeta";

const CATEGORIAS = {
  pre: "Previa",
  after: "After",
  mismo_dia: "Mismo día",
  comunidad: "Comunidad",
};

function textoLugares(grupo) {
  if (!grupo.cupo) return `${grupo.integrantes} ${grupo.integrantes === 1 ? "va" : "van"}`;
  const libres = Math.max(grupo.cupo - grupo.integrantes, 0);
  return `${grupo.integrantes}/${grupo.cupo} · ${libres === 1 ? "queda 1 lugar" : `quedan ${libres} lugares`}`;
}

// Filas de fecha, hora y lugar (las mismas en las dos tarjetas).
function MetaTarjeta({ fecha, hora, lugar }) {
  return (
    <ul className="tarjetaFaniMeta">
      {fecha && fecha !== "a confirmar" && (
        <li>
          <IconoCalendario />
          <span>{formatearFechaLarga(fecha)}</span>
        </li>
      )}
      {hora && (
        <li>
          <IconoReloj />
          <span>{hora} hs</span>
        </li>
      )}
      {lugar && (
        <li>
          <IconoUbicacion />
          <span>{lugar}</span>
        </li>
      )}
    </ul>
  );
}

// Tarjeta de un grupo que mostró Fani. El backend suma al usuario recién
// cuando toca Unirme.
function TarjetaGrupoFani({ grupo, uniendo, deshabilitado, onUnirse, onAbrirChat }) {
  const [error, setError] = useState("");

  async function unirse() {
    setError("");
    setError((await onUnirse({ idGrupo: grupo.id_grupo })) || "");
  }

  return (
    <article className="tarjetaFani">
      <div className="tarjetaFaniArriba">
        <span className="tarjetaFaniChip">{CATEGORIAS[grupo.categoria] || "Grupo"}</span>
        {grupo.concierto && <span className="tarjetaFaniConcierto">{grupo.concierto}</span>}
      </div>
      <h3 className="tarjetaFaniTitulo">{grupo.nombre}</h3>
      <MetaTarjeta fecha={grupo.fecha} hora={grupo.hora} lugar={grupo.punto_de_encuentro} />

      <div className="tarjetaFaniPie">
        <span className="tarjetaFaniLugares">{textoLugares(grupo)}</span>
        {grupo.unido ? (
          <button type="button" className="tarjetaFaniBoton tarjetaFaniBoton--unido" onClick={() => onAbrirChat(grupo.id_grupo)}>
            Ir al chat
          </button>
        ) : (
          <button type="button" className="tarjetaFaniBoton" onClick={unirse} disabled={deshabilitado}>
            {uniendo ? "Uniendo…" : "Unirme"}
          </button>
        )}
      </div>
      {grupo.unido && <span className="accionFaniEstado accionFaniEstado--hecha">Te sumaste ✓</span>}
      {error && !grupo.unido && <span className="tarjetaFaniError">{error}</span>}
    </article>
  );
}

// Tarjeta de un concierto que mostró Fani. Para unirse hace falta el código
// de acceso: lo escribe el usuario, Fani nunca lo sabe.
function TarjetaConciertoFani({ concierto, uniendo, deshabilitado, onUnirse, onVerConcierto }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  async function unirse(evento) {
    evento.preventDefault();
    if (!codigo.trim()) {
      setError("Escribí el código de acceso");
      return;
    }
    setError("");
    setError((await onUnirse({ idConcierto: concierto.id_concierto, codigo: codigo.trim() })) || "");
  }

  const lugar = [concierto.estadio, concierto.ciudad].filter(Boolean).join(", ");

  return (
    <article className="tarjetaFani">
      <div className="tarjetaFaniConciertoCabecera">
        {concierto.imagen && <img className="tarjetaFaniImagen" src={concierto.imagen} alt="" />}
        <div className="tarjetaFaniConciertoTitulos">
          <span className="tarjetaFaniChip">Concierto</span>
          <h3 className="tarjetaFaniTitulo">{concierto.nombre}</h3>
          {concierto.artista && <span className="tarjetaFaniConcierto">{concierto.artista}</span>}
        </div>
      </div>
      <MetaTarjeta fecha={concierto.fecha} hora={concierto.hora} lugar={lugar} />
      <span className="tarjetaFaniLugares">
        {concierto.fans_unidos} {concierto.fans_unidos === 1 ? "fan unido" : "fans unidos"}
      </span>

      {concierto.unido ? (
        <div className="tarjetaFaniPie">
          <span className="accionFaniEstado accionFaniEstado--hecha">Ya estás unido ✓</span>
          <button
            type="button"
            className="tarjetaFaniBoton tarjetaFaniBoton--unido"
            onClick={() => onVerConcierto(concierto.id_concierto)}
          >
            Ver concierto
          </button>
        </div>
      ) : (
        <form className="tarjetaFaniCodigo" onSubmit={unirse}>
          <input
            type="text"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="Código de acceso"
            aria-label={`Código de acceso de ${concierto.nombre}`}
            autoComplete="off"
            disabled={deshabilitado}
          />
          <button type="submit" className="tarjetaFaniBoton" disabled={deshabilitado}>
            {uniendo ? "Uniendo…" : "Unirme"}
          </button>
        </form>
      )}
      {error && !concierto.unido && <span className="tarjetaFaniError">{error}</span>}
    </article>
  );
}

// Lo que Fani deja dentro de su mensaje: tarjetas de conciertos y grupos con
// Unirme o, en mensajes viejos, una propuesta con Confirmar / Cancelar. Fani
// no hace nada sola: el backend actúa recién cuando el usuario toca un botón.
// `resolviendo`: qué tarjeta se está uniendo ("c-3", "g-10") o true.
function AccionFani({ idMensaje, accion, resolviendo, onResolver, onAbrirChatGrupo, onVerConcierto }) {
  if (accion?.tipo === "tarjetas" || accion?.tipo === "grupos") {
    const unirse = (objetivo) => onResolver(idMensaje, "confirmar", objetivo);
    return (
      <div className="tarjetasFani">
        {(accion.conciertos ?? []).map((concierto) => (
          <TarjetaConciertoFani
            key={`c-${concierto.id_concierto}`}
            concierto={concierto}
            uniendo={resolviendo === `c-${concierto.id_concierto}`}
            deshabilitado={resolviendo != null}
            onUnirse={unirse}
            onVerConcierto={onVerConcierto}
          />
        ))}
        {(accion.grupos ?? []).map((grupo) => (
          <TarjetaGrupoFani
            key={`g-${grupo.id_grupo}`}
            grupo={grupo}
            uniendo={resolviendo === `g-${grupo.id_grupo}`}
            deshabilitado={resolviendo != null}
            onUnirse={unirse}
            onAbrirChat={onAbrirChatGrupo}
          />
        ))}
      </div>
    );
  }

  if (accion?.tipo !== "unirse_grupo") return null;

  return (
    <div className="accionFani">
      <span className="accionFaniTitulo">Sumarte a {accion.grupo}</span>
      {accion.concierto && <span className="accionFaniDetalle">{accion.concierto}</span>}

      {accion.estado === "pendiente" && (
        <div className="accionFaniBotones">
          <button
            type="button"
            className="accionFaniConfirmar"
            onClick={() => onResolver(idMensaje, "confirmar")}
            disabled={resolviendo != null}
          >
            {resolviendo != null ? "Un momento…" : "Confirmar"}
          </button>
          <button
            type="button"
            className="accionFaniCancelar"
            onClick={() => onResolver(idMensaje, "cancelar")}
            disabled={resolviendo != null}
          >
            Cancelar
          </button>
        </div>
      )}
      {accion.estado === "hecha" && <span className="accionFaniEstado accionFaniEstado--hecha">Te sumaste ✓</span>}
      {accion.estado === "cancelada" && <span className="accionFaniEstado">Cancelado</span>}
    </div>
  );
}

export default AccionFani;
