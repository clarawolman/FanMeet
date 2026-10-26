import { useEffect, useRef, useState } from "react";
import "./highlightsPerfil.css";
import NuevoMomento from "./nuevoMomento";
import { momentosService } from "../../services/momentosService";
import { mostrarAviso } from "../../utils/avisos";
import { partesFecha } from "../../utils/fechas";
import {
  IconoCarrusel,
  IconoFijado,
  IconoGrilla,
  IconoGuardar,
} from "../momento/iconosMomento";

export const MAX_FOTOS = 10;

// Momentos del perfil: cada uno es una entrada de recital (foto + talón con
// el concierto). En el propio perfil hay una pestaña con los guardados
// (solo los ve uno).
// privado: es un perfil privado y quien mira no es amigo (no ve los momentos).
export default function HighlightsPerfil({ idPerfil, isOwnProfile, privado, onAbrirMomento }) {
  const inputArchivoRef = useRef(null);
  const [pestana, setPestana] = useState("momentos");
  const [momentos, setMomentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // Fotos elegidas que todavía no se publicaron
  const [fotosNuevas, setFotosNuevas] = useState(null);
  // Sube para volver a pedir la lista (después de publicar)
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const pedido =
      pestana === "guardados"
        ? momentosService.listarGuardados()
        : momentosService.listarDeUsuario(idPerfil);
    pedido
      .then((datos) => {
        if (cancelado) return;
        setMomentos(datos || []);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("Error cargando momentos:", err);
        setMomentos([]);
        setError(err.message);
      })
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [idPerfil, pestana, version]);

  function cambiarPestana(nueva) {
    if (nueva === pestana) return;
    setCargando(true);
    setMomentos([]);
    setPestana(nueva);
  }

  function manejarArchivosSeleccionados(e) {
    const archivos = [...(e.target.files || [])];
    e.target.value = "";
    if (archivos.length === 0) return;
    if (archivos.length > MAX_FOTOS) {
      mostrarAviso(`Podés subir hasta ${MAX_FOTOS} fotos por momento. Usamos las primeras ${MAX_FOTOS}.`, "info");
    }
    setFotosNuevas(archivos.slice(0, MAX_FOTOS));
  }

  function alPublicar(cantidadEtiquetados) {
    setFotosNuevas(null);
    setCargando(true);
    if (pestana === "momentos") setVersion((v) => v + 1);
    else cambiarPestana("momentos");
    mostrarAviso(
      cantidadEtiquetados > 0
        ? `Publicado. ${cantidadEtiquetados === 1 ? "Le avisamos a tu amigo" : "Les avisamos a tus amigos"} para que lo sumen a su perfil.`
        : "Publicado.",
      "exito"
    );
  }

  const vacio = !cargando && !error && momentos.length === 0;

  return (
    <section className="highlightsPerfil">
      <div className="highlightsPerfilHeader">
        <h3>Momentos</h3>

        {isOwnProfile && (
          <button
            type="button"
            className="highlightsPerfilPublicar"
            onClick={() => inputArchivoRef.current?.click()}
          >
            + Nuevo momento
          </button>
        )}
        {isOwnProfile && (
          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={manejarArchivosSeleccionados}
            hidden
          />
        )}
      </div>

      {isOwnProfile && (
        <div className="highlightsPerfilPestanas" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={pestana === "momentos"}
            className={pestana === "momentos" ? "activa" : ""}
            onClick={() => cambiarPestana("momentos")}
          >
            <IconoGrilla width="16" height="16" /> Momentos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === "guardados"}
            className={pestana === "guardados" ? "activa" : ""}
            onClick={() => cambiarPestana("guardados")}
          >
            <IconoGuardar width="16" height="16" /> Guardados
          </button>
        </div>
      )}

      {error && <p className="highlightsPerfilVacio">No pudimos cargar los momentos ({error}).</p>}

      {vacio && (
        <p className="highlightsPerfilVacio">
          {pestana === "guardados"
            ? "Todavía no guardaste momentos. Tocá el marcador en un momento para guardarlo acá (solo vos lo ves)."
            : privado
              ? "Sus momentos los ven solo sus amigos. Mandale una solicitud para verlos."
              : isOwnProfile
              ? "Compartí las fotos de tus recitales: podés subir varias, contar cómo fue y etiquetar a quienes fueron con vos."
              : "Todavía no hay fotos de recitales."}
        </p>
      )}

      {cargando && momentos.length === 0 && (
        <div className="highlightsPerfilGrid" aria-hidden="true">
          <span className="highlightCard fmSkeleton" />
          <span className="highlightCard fmSkeleton" />
          <span className="highlightCard fmSkeleton" />
        </div>
      )}

      {momentos.length > 0 && (
        <div className="highlightsPerfilGrid">
          {momentos.map((momento) => {
            const participantes = momento.participantes || [];
            const fecha = partesFecha(momento.concierto?.fecha || momento.created_at);
            const titulo = momento.concierto?.nombre || momento.descripcion || "Un recuerdo";
            return (
              <button
                className="highlightCard"
                type="button"
                key={momento.id_highlight}
                onClick={() => onAbrirMomento?.(momento.id_highlight)}
                aria-label={`Ver momento: ${titulo}`}
              >
                <span className="highlightCardFoto">
                  <img src={momento.url_imagen} alt="" loading="lazy" />

                  <span className="highlightCardIconos" aria-hidden="true">
                    {momento.fijado && <IconoFijado lleno width="15" height="15" />}
                    {momento.cantidadFotos > 1 && <IconoCarrusel width="15" height="15" />}
                  </span>

                  {participantes.length > 1 && (
                    <span className="highlightCardParticipantes" aria-hidden="true">
                      {participantes.slice(0, 3).map((u) => (
                        <img key={u.id_usuario} src={u.foto_perfil} alt="" />
                      ))}
                    </span>
                  )}
                </span>

                {/* talón de la entrada: el día a la izquierda, el concierto a la derecha */}
                <span className="highlightCardTalon" aria-hidden="true">
                  {fecha && (
                    <span className="highlightCardFecha">
                      <b>{fecha.dia}</b>
                      {fecha.mes}
                    </span>
                  )}
                  <span className="highlightCardTexto">
                    <span className="highlightCardTitulo">{titulo}</span>
                    <span className="highlightCardSub">
                      {momento.concierto ? `Estuve ahí${fecha ? ` · ${fecha.anio}` : ""}` : fecha?.anio}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {fotosNuevas && (
        <NuevoMomento
          fotos={fotosNuevas}
          onPublicado={alPublicar}
          onCancelar={() => setFotosNuevas(null)}
        />
      )}
    </section>
  );
}
