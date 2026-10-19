import { useEffect, useState } from "react";
import "./MomentoModal.css";
import "../perfil/nuevoMomento.css";
import { IconoCerrar } from "../generales/iconosNav";
import { conciertosService } from "../../services/conciertosService";
import { momentosService } from "../../services/momentosService";
import { formatearFechaLarga } from "../../utils/fechas";
import { mostrarAviso } from "../../utils/avisos";

const MAX_DESCRIPCION = 2200;

// Editar como en Instagram: pie de foto, concierto y opciones (las fotos no).
export default function EditarMomento({ momento, onCerrar, onGuardado }) {
  const [descripcion, setDescripcion] = useState(momento.descripcion || "");
  const [idConcierto, setIdConcierto] = useState(momento.concierto?.id_concierto ?? "");
  const [comentariosActivados, setComentariosActivados] = useState(momento.comentariosActivados);
  const [ocultarLikes, setOcultarLikes] = useState(momento.ocultarLikes);
  const [conciertos, setConciertos] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    conciertosService
      .listarMisEventos()
      .then((datos) =>
        setConciertos([...(datos || [])].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || ""))))
      )
      .catch((error) => console.error("Error cargando conciertos:", error));
  }, []);

  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && !guardando && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [guardando, onCerrar]);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const actualizado = await momentosService.editar(momento.id_highlight, {
        descripcion: descripcion.trim(),
        id_concierto: idConcierto ? Number(idConcierto) : null,
        comentarios_activados: comentariosActivados,
        ocultar_likes: ocultarLikes,
      });
      onGuardado(actualizado);
    } catch (error) {
      setGuardando(false);
      mostrarAviso("No se pudo guardar: " + error.message);
    }
  }

  return (
    <div className="momentoModalFondo" role="dialog" aria-modal="true" aria-label="Editar momento">
      <form className="momentoModalCaja" onSubmit={guardar}>
        <header className="momentoModalHeader">
          <h2>Editar momento</h2>
          <button type="button" className="momentoModalCerrar" onClick={onCerrar} disabled={guardando} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </header>

        <div className="momentoModalCuerpo nuevoMomentoDatos">
          <div className="nuevoMomentoCampo">
            <label htmlFor="editar-descripcion">Pie de foto</label>
            <textarea
              id="editar-descripcion"
              rows={5}
              maxLength={MAX_DESCRIPCION}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              autoFocus
            />
            <span className="nuevoMomentoContadorTexto">
              {descripcion.length}/{MAX_DESCRIPCION}
            </span>
          </div>

          <div className="nuevoMomentoCampo">
            <label htmlFor="editar-concierto">Concierto</label>
            <select id="editar-concierto" value={idConcierto} onChange={(e) => setIdConcierto(e.target.value)}>
              <option value="">Sin concierto</option>
              {/* Si ya no está unido al concierto elegido, igual se muestra */}
              {momento.concierto && !conciertos.some((c) => c.id_concierto === momento.concierto.id_concierto) && (
                <option value={momento.concierto.id_concierto}>{momento.concierto.nombre}</option>
              )}
              {conciertos.map((c) => (
                <option key={c.id_concierto} value={c.id_concierto}>
                  {c.nombre || c.artista?.nombre}
                  {c.fecha ? ` · ${formatearFechaLarga(c.fecha)}` : ""}
                </option>
              ))}
            </select>
          </div>

          <label className="nuevoMomentoInterruptor">
            <span>
              <strong>Ocultar la cantidad de me gusta</strong>
              <small>Solo vos y quienes compartan el momento la ven.</small>
            </span>
            <input type="checkbox" checked={ocultarLikes} onChange={(e) => setOcultarLikes(e.target.checked)} />
          </label>
          <label className="nuevoMomentoInterruptor">
            <span>
              <strong>Desactivar comentarios</strong>
              <small>Los que ya están quedan, pero nadie puede sumar nuevos.</small>
            </span>
            <input
              type="checkbox"
              checked={!comentariosActivados}
              onChange={(e) => setComentariosActivados(!e.target.checked)}
            />
          </label>
        </div>

        <footer className="momentoModalPie">
          <div className="momentoModalBotones">
            <button type="button" className="momentoModalSecundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="fmBotonPrimario" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
