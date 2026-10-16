import { useState } from "react";
import { api } from "../api";
import { Avatar, Cargando, Estado } from "../componentes";
import { fechaCorta, useCarga } from "../utilidades";

function ListaReportes({ reportes, campo }) {
  if (reportes.length === 0) return <p className="textoSuave">Ninguno.</p>;
  return (
    <ul className="lista">
      {reportes.map((r) => (
        <li key={r.id_reporte}>
          <a href={`#reporte-${r.id_reporte}`}>
            {fechaCorta(r.created_at)} · {r[campo]?.nombre}: “{r.motivo}”
          </a>{" "}
          <Estado valor={r.estado} />
        </li>
      ))}
    </ul>
  );
}

export default function UsuarioDetalle({ id }) {
  const { datos: u, error, cargando, recargar } = useCarga(() => api.usuario(id), [id]);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  async function cambiarEstado(estado) {
    setGuardando(true);
    setErrorAccion("");
    try {
      await api.cambiarEstado(id, estado, estado === "suspendido" ? motivo.trim() : undefined);
      setMotivo("");
      await recargar();
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <a href="#usuarios" className="volver">← Usuarios</a>
      <Cargando error={error} cargando={cargando}>
        {u && (
          <>
            <div className="perfilCabecera">
              <Avatar usuario={u} />
              <div>
                <h1>
                  {u.nombre} <Estado valor={u.estado} />
                </h1>
                <p className="textoSuave">
                  {u.mail} · {u.rol === "moderador" ? "Moderador" : "Fan"}
                </p>
              </div>
            </div>

            <div className="dosColumnas">
              <section className="tarjeta">
                <h2>Estado de la cuenta</h2>
                {u.estado === "suspendido" ? (
                  <>
                    <p>
                      Suspendido el {fechaCorta(u.suspendido_at)}. Motivo: <em>{u.motivo_suspension || "—"}</em>
                    </p>
                    <p className="textoSuave">No puede entrar a la app ni volver a registrarse con este mail.</p>
                    {errorAccion && <p className="mensajeError">{errorAccion}</p>}
                    <button className="boton" type="button" disabled={guardando} onClick={() => cambiarEstado("activo")}>
                      Reactivar cuenta
                    </button>
                  </>
                ) : (
                  <>
                    <p className="textoSuave">
                      Suspender lo deja afuera de toda la app al instante y bloquea su mail.
                    </p>
                    <label>
                      Motivo
                      <textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        maxLength={1000}
                        placeholder="Por qué se suspende"
                      />
                    </label>
                    {errorAccion && <p className="mensajeError">{errorAccion}</p>}
                    <button
                      className="boton botonPeligro"
                      type="button"
                      disabled={guardando || !motivo.trim()}
                      onClick={() => cambiarEstado("suspendido")}
                    >
                      Suspender usuario
                    </button>
                  </>
                )}
              </section>

              <section className="tarjeta">
                <h2>Actividad</h2>
                <h3>Conciertos ({u.conciertos.length})</h3>
                <p>{u.conciertos.map((c) => c.nombre).join(", ") || "Ninguno"}</p>
                <h3>Grupos ({u.grupos.length})</h3>
                <p>{u.grupos.map((g) => g.nombre).join(", ") || "Ninguno"}</p>
              </section>
            </div>

            <div className="dosColumnas">
              <section className="tarjeta">
                <h2>Reportes recibidos ({u.reportesRecibidos.length})</h2>
                <ListaReportes reportes={u.reportesRecibidos} campo="reportante" />
              </section>
              <section className="tarjeta">
                <h2>Reportes que hizo ({u.reportesHechos.length})</h2>
                <ListaReportes reportes={u.reportesHechos} campo="reportado" />
              </section>
            </div>
          </>
        )}
      </Cargando>
    </>
  );
}
