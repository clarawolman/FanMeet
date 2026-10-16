import { useEffect, useState } from "react";
import { api } from "../api";
import { Avatar, Cargando, Estado } from "../componentes";
import { irA, useCarga } from "../utilidades";

export default function Usuarios() {
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");

  // Espera a que se deje de escribir para no pedir en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(texto.trim()), 300);
    return () => clearTimeout(t);
  }, [texto]);

  const { datos, error, cargando } = useCarga(() => api.usuarios({ busqueda, estado }), [busqueda, estado]);

  return (
    <>
      <h1>Usuarios</h1>
      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por nombre o mail"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="suspendido">Suspendidos</option>
        </select>
      </div>

      <Cargando error={error} cargando={cargando}>
        {datos?.length === 0 ? (
          <p className="textoSuave">No hay usuarios con ese filtro.</p>
        ) : (
          <div className="tablaScroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Mail</th>
                  <th>Estado</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {datos?.map((u) => (
                  <tr key={u.id_usuario} className="filaClick" onClick={() => irA(`usuario-${u.id_usuario}`)}>
                    <td>
                      <span className="conAvatar">
                        <Avatar usuario={u} />
                        <strong>{u.nombre}</strong>
                      </span>
                    </td>
                    <td>{u.mail}</td>
                    <td>
                      <Estado valor={u.estado} />
                    </td>
                    <td>{u.rol === "moderador" ? "Moderador" : "Fan"}</td>
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
