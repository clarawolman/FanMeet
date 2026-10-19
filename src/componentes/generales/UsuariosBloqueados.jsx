import { useEffect, useState } from "react";
import { bloqueosService } from "../../services/bloqueosService";
import { mostrarAviso } from "../../utils/avisos";

// Lista de Configuración con los usuarios que bloqueaste, para
// desbloquearlos. Se recarga cada vez que se abre el panel. Desbloquear no
// devuelve la amistad: hay que volver a mandar la solicitud.
function UsuariosBloqueados({ abierto }) {
  const [bloqueados, setBloqueados] = useState(null);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    bloqueosService
      .listar()
      .then((lista) => activo && setBloqueados(lista || []))
      .catch(() => activo && setBloqueados([]));
    return () => {
      activo = false;
    };
  }, [abierto]);

  async function desbloquear(usuario) {
    setProcesando(usuario.id_usuario);
    try {
      await bloqueosService.desbloquear(usuario.id_usuario);
      setBloqueados((lista) => lista.filter((u) => u.id_usuario !== usuario.id_usuario));
      mostrarAviso(`Desbloqueaste a ${usuario.nombre}.`, "info");
    } catch (error) {
      mostrarAviso("No se pudo desbloquear: " + error.message);
    }
    setProcesando(null);
  }

  return (
    <section className="menuConfigBloqueados">
      <div className="menuConfigItemTexto">
        <strong>Usuarios bloqueados</strong>
        <span>
          {bloqueados === null
            ? "Cargando…"
            : bloqueados.length === 0
              ? "No bloqueaste a nadie."
              : "No te ven ni te pueden escribir."}
        </span>
      </div>

      {bloqueados?.length > 0 && (
        <ul className="menuConfigBloqueadosLista">
          {bloqueados.map((usuario) => (
            <li key={usuario.id_usuario} className="menuConfigBloqueado">
              <img src={usuario.fotoperfil} alt="" className="menuConfigBloqueadoFoto" />
              <span className="menuConfigBloqueadoNombre">{usuario.nombre}</span>
              <button
                type="button"
                className="menuConfigDesbloquear"
                onClick={() => desbloquear(usuario)}
                disabled={procesando === usuario.id_usuario}
              >
                {procesando === usuario.id_usuario ? "…" : "Desbloquear"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default UsuariosBloqueados;
