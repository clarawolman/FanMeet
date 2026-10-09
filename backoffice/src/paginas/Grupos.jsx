import { useState } from "react";
import { api } from "../api";
import { Cargando, Conversacion } from "../componentes";
import { fechaCorta, useCarga } from "../utilidades";

const CATEGORIAS = { pre: "Previa", after: "After", mismo_dia: "Mismo día" };

function MensajesDelGrupo({ idGrupo }) {
  const { datos, error, cargando } = useCarga(() => api.mensajesDeGrupo(idGrupo), [idGrupo]);
  return (
    <Cargando error={error} cargando={cargando}>
      {datos && <Conversacion mensajes={datos.mensajes} />}
    </Cargando>
  );
}

export default function Grupos() {
  const { datos, error, cargando } = useCarga(() => api.grupos(), []);
  const [abierto, setAbierto] = useState(null);

  return (
    <>
      <h1>Grupos</h1>
      <Cargando error={error} cargando={cargando}>
        {abierto && (
          <section className="tarjeta">
            <div className="tituloConAccion">
              <h2>Chat de "{abierto.nombre}"</h2>
              <button className="botonTexto" type="button" onClick={() => setAbierto(null)}>
                Cerrar
              </button>
            </div>
            <MensajesDelGrupo idGrupo={abierto.id_grupo} />
          </section>
        )}

        <div className="tablaScroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Concierto</th>
                <th>Tipo</th>
                <th>Cuándo</th>
                <th>Integrantes</th>
                <th>Mensajes</th>
              </tr>
            </thead>
            <tbody>
              {datos?.map((g) => (
                <tr key={g.id_grupo} className="filaClick" onClick={() => setAbierto(g)}>
                  <td>
                    <strong>{g.nombre}</strong>
                    {g.descripcion && <div className="textoSuave celdaTexto">{g.descripcion}</div>}
                  </td>
                  <td>{g.concierto}</td>
                  <td>{CATEGORIAS[g.categoria] || g.categoria}</td>
                  <td>{fechaCorta(`${g.fecha}T${g.hora || "00:00"}`)}</td>
                  <td>{g.cantidadIntegrantes}</td>
                  <td>{g.cantidadMensajes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cargando>
    </>
  );
}
