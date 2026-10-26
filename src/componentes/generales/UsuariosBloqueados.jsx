import { useEffect, useState } from "react";
import { bloqueosService } from "../../services/bloqueosService";
import { mostrarAviso } from "../../utils/avisos";

// Lista de Configuración → Privacidad con los usuarios que bloqueaste, para
// desbloquearlos. Se recarga cada vez que se abre. Desbloquear no devuelve
// la amistad: hay que volver a mandar la solicitud.
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
    <div className="configBloqueados">
      <p className="configTexto">
        {bloqueados === null
          ? "Cargando…"
          : bloqueados.length === 0
            ? "No bloqueaste a nadie. Para bloquear a alguien, entrá a su perfil."
            : "No te ven ni te pueden escribir."}
      </p>

      {bloqueados?.length > 0 && (
        <ul className="configBloqueadosLista">
          {bloqueados.map((usuario) => (
            <li key={usuario.id_usuario} className="configBloqueado">
              <img src={usuario.fotoperfil} alt="" />
              <span>{usuario.nombre}</span>
              <button
                type="button"
                className="configBoton"
                onClick={() => desbloquear(usuario)}
                disabled={procesando === usuario.id_usuario}
              >
                {procesando === usuario.id_usuario ? "…" : "Desbloquear"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UsuariosBloqueados;
