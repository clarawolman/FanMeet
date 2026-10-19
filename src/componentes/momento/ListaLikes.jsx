import { useEffect, useState } from "react";
import "./MomentoModal.css";
import { IconoCerrar } from "../generales/iconosNav";
import LoadingSpinner from "../generales/LoadingSpinner";

// Lista de personas en un modal: a quiénes les gustó, o quiénes comparten el momento.
export default function ListaLikes({ titulo, cargarUsuarios, onCerrar, onVerUsuario }) {
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    cargarUsuarios()
      .then((datos) => !cancelado && setUsuarios(datos || []))
      .catch((err) => !cancelado && setError(err.message));
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div className="momentoModalFondo" role="dialog" aria-modal="true" aria-label={titulo} onClick={onCerrar}>
      <div className="momentoModalCaja" onClick={(e) => e.stopPropagation()}>
        <header className="momentoModalHeader">
          <h2>{titulo}</h2>
          <button type="button" className="momentoModalCerrar" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </header>

        <div className="momentoModalCuerpo">
          {error && <p className="momentoModalAyuda">{error}</p>}
          {!error && usuarios === null && <LoadingSpinner texto="Cargando…" />}
          {usuarios?.length === 0 && <p className="momentoModalAyuda">Todavía nadie.</p>}
          <ul className="momentoModalUsuarios">
            {(usuarios || []).map((u) => (
              <li key={u.id_usuario}>
                <button type="button" className="momentoModalUsuario" onClick={() => onVerUsuario(u.id_usuario)}>
                  <img src={u.foto_perfil || u.fotoperfil} alt="" />
                  <span>
                    <strong>{u.nombre}</strong>
                    {u.apodo && <small>{u.apodo}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
