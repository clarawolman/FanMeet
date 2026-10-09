import { useState } from "react";
import { api } from "../api";
import { Cargando, Conversacion, Estado } from "../componentes";
import { fechaCorta, useCarga } from "../utilidades";

export default function ReporteDetalle({ id }) {
  const { datos: r, error, cargando, recargar } = useCarga(() => api.reporte(id), [id]);
  const [resolucion, setResolucion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  async function resolver(decision) {
    setGuardando(true);
    setErrorAccion("");
    try {
      await api.resolverReporte(id, decision, resolucion.trim() || undefined);
      setResolucion("");
      await recargar();
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <a href="#reportes" className="volver">← Reportes</a>
      <Cargando error={error} cargando={cargando}>
        {r && (
          <>
            <h1>
              Reporte #{r.id_reporte} <Estado valor={r.estado} />
            </h1>

            <div className="dosColumnas">
              <section className="tarjeta">
                <h2>Qué pasó</h2>
                <p className="motivo">{r.motivo}</p>
                <dl className="datos">
                  <dt>Reportado</dt>
                  <dd>
                    <a href={`#usuario-${r.id_reportado}`}>{r.reportado?.nombre}</a> ({r.reportado?.mail}){" "}
                    <Estado valor={r.reportado?.estado} />
                  </dd>
                  <dt>Reportó</dt>
                  <dd>
                    <a href={`#usuario-${r.id_reportante}`}>{r.reportante?.nombre}</a>
                  </dd>
                  <dt>Dónde</dt>
                  <dd>{r.grupo ? `Grupo "${r.grupo.nombre}"` : "Chat privado / perfil"}</dd>
                  <dt>Fecha</dt>
                  <dd>{fechaCorta(r.created_at)}</dd>
                  <dt>Otros reportes contra esta persona</dt>
                  <dd>{r.otrosReportesContraElUsuario}</dd>
                </dl>
              </section>

              <section className="tarjeta">
                <h2>Decisión</h2>
                {r.estado === "pendiente" ? (
                  <>
                    <p className="textoSuave">
                      Suspender deja a {r.reportado?.nombre} afuera de toda la app. Se puede reactivar
                      después desde su perfil.
                    </p>
                    <label>
                      Nota para el registro (opcional)
                      <textarea
                        value={resolucion}
                        onChange={(e) => setResolucion(e.target.value)}
                        maxLength={1000}
                        placeholder="Ej: insultos repetidos en el grupo"
                      />
                    </label>
                    {errorAccion && <p className="mensajeError">{errorAccion}</p>}
                    <div className="acciones">
                      <button className="boton botonPeligro" type="button" disabled={guardando} onClick={() => resolver("sancionar")}>
                        Suspender usuario
                      </button>
                      <button className="boton" type="button" disabled={guardando} onClick={() => resolver("descartar")}>
                        Descartar reporte
                      </button>
                    </div>
                  </>
                ) : (
                  <dl className="datos">
                    <dt>Resultado</dt>
                    <dd>
                      <Estado valor={r.estado} />
                    </dd>
                    <dt>Moderador</dt>
                    <dd>{r.moderador?.nombre || "—"}</dd>
                    <dt>Cuándo</dt>
                    <dd>{fechaCorta(r.resuelto_at)}</dd>
                    <dt>Nota</dt>
                    <dd>{r.resolucion || "—"}</dd>
                  </dl>
                )}
              </section>
            </div>

            <section className="tarjeta">
              <h2>
                {r.contexto.tipo === "grupo" ? "Últimos mensajes del grupo" : "Chat privado entre los dos"}
              </h2>
              <Conversacion mensajes={r.contexto.mensajes} destacado={r.id_reportado} />
            </section>
          </>
        )}
      </Cargando>
    </>
  );
}

