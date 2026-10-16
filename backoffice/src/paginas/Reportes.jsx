import { useState } from "react";
import { api } from "../api";
import { Cargando, Estado } from "../componentes";
import { fechaCorta, irA, useCarga } from "../utilidades";

const FILTROS = [
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "sancionado", texto: "Sancionados" },
  { valor: "descartado", texto: "Descartados" },
  { valor: "", texto: "Todos" },
];

export default function Reportes() {
  const [estado, setEstado] = useState("pendiente");
  const { datos, error, cargando } = useCarga(() => api.reportes({ estado }), [estado]);

  return (
    <>
      <h1>Reportes</h1>
      <div className="pestanas">
        {FILTROS.map((f) => (
          <button
            key={f.texto}
            type="button"
            className={estado === f.valor ? "activo" : ""}
            onClick={() => setEstado(f.valor)}
          >
            {f.texto}
          </button>
        ))}
      </div>

      <Cargando error={error} cargando={cargando}>
        {datos?.length === 0 ? (
          <p className="textoSuave">No hay reportes acá.</p>
        ) : (
          <div className="tablaScroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Reportado</th>
                  <th>Reportó</th>
                  <th>Dónde</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos?.map((r) => (
                  <tr key={r.id_reporte} className="filaClick" onClick={() => irA(`reporte-${r.id_reporte}`)}>
                    <td>{fechaCorta(r.created_at)}</td>
                    <td>
                      <strong>{r.reportado?.nombre}</strong>
                      {r.reportado?.estado === "suspendido" && <> <Estado valor="suspendido" /></>}
                    </td>
                    <td>{r.reportante?.nombre}</td>
                    <td>{r.grupo ? `Grupo: ${r.grupo.nombre}` : "Privado"}</td>
                    <td className="celdaTexto">{r.motivo}</td>
                    <td>
                      <Estado valor={r.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cargando>
    </>
  );
}
