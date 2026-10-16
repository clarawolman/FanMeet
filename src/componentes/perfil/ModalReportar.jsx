import { useEffect, useState } from "react";
import "../generales/ModalConfirmacion.css";
import "./ModalReportar.css";
import { gruposService } from "../../services/gruposService";
import { reportesService } from "../../services/reportesService";

// Reportar a otro usuario: le llega un mail al moderador y lo revisa en el
// backoffice. Se ofrecen los grupos que tienen en común para que el
// moderador pueda ver esa conversación.
export default function ModalReportar({ usuario, onCerrar }) {
  const [gruposEnComun, setGruposEnComun] = useState([]);
  const [idGrupo, setIdGrupo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    let activo = true;
    gruposService
      .listarMisGrupos()
      .then((grupos) => {
        if (!activo) return;
        setGruposEnComun(
          grupos.filter((g) => (g.usuarios || []).some((u) => u.id_usuario === usuario.id_usuario))
        );
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [usuario.id_usuario]);

  async function manejarEnviar(e) {
    e.preventDefault();
    if (motivo.trim().length < 5) {
      setError("Contanos un poco más qué pasó.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await reportesService.reportar({
        idReportado: usuario.id_usuario,
        idGrupo: idGrupo ? Number(idGrupo) : null,
        motivo: motivo.trim(),
      });
      setEnviado(true);
    } catch (err) {
      setError(err.message || "No se pudo mandar el reporte");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modalConfirmacionFondo" onClick={onCerrar}>
      <div className="modalConfirmacionCaja modalReportarCaja" onClick={(e) => e.stopPropagation()}>
        {enviado ? (
          <>
            <p className="modalConfirmacionTexto">Gracias por avisarnos</p>
            <p className="modalReportarAyuda">
              Un moderador va a revisar lo que pasó con {usuario.nombre}.
            </p>
            <button className="modalConfirmacionBotonSecundario" type="button" onClick={onCerrar}>
              Listo
            </button>
          </>
        ) : (
          <form className="modalReportarForm" onSubmit={manejarEnviar}>
            <p className="modalConfirmacionTexto">Reportar a {usuario.nombre}</p>

            <label className="modalReportarLabel" htmlFor="reporte-donde">
              ¿Dónde pasó?
            </label>
            <select
              id="reporte-donde"
              className="modalReportarCampo"
              value={idGrupo}
              onChange={(e) => setIdGrupo(e.target.value)}
            >
              <option value="">Chat privado o perfil</option>
              {gruposEnComun.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  Grupo: {g.nombre}
                </option>
              ))}
            </select>

            <label className="modalReportarLabel" htmlFor="reporte-motivo">
              ¿Qué pasó?
            </label>
            <textarea
              id="reporte-motivo"
              className="modalReportarCampo modalReportarTexto"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={1000}
              placeholder="Contanos qué hizo o dijo"
            />

            {error && <p className="modalReportarError">{error}</p>}

            <button className="modalConfirmacionBotonSecundario" type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar reporte"}
            </button>
            <button
              className="modalConfirmacionBotonPrincipal modalReportarCancelar"
              type="button"
              onClick={onCerrar}
              disabled={enviando}
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
