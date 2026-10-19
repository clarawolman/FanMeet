import { useContext, useEffect, useState } from "react";
import "./MomentoModal.css";
import { IconoBuscar, IconoCerrar } from "../generales/iconosNav";
import { amistadService } from "../../services/amistadService";
import { chatsService } from "../../services/chatsService";
import { linkDeMomento } from "../../services/momentosService";
import { UsuarioContext } from "../../context/UsuarioContext";
import { mostrarAviso } from "../../utils/avisos";

// "Enviar" de Instagram: se manda el momento por chat privado a uno o
// varios amigos (en el chat se ve como tarjeta), o se copia el enlace.
export default function CompartirMomento({ idMomento, onCerrar }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [amigos, setAmigos] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [elegidos, setElegidos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const link = linkDeMomento(idMomento);

  useEffect(() => {
    let cancelado = false;
    amistadService
      .listarAmigos(usuarioActual.id_usuario)
      .then((datos) => !cancelado && setAmigos(datos || []))
      .catch(() => !cancelado && setAmigos([]));
    return () => {
      cancelado = true;
    };
  }, [usuarioActual.id_usuario]);

  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && !enviando && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [enviando, onCerrar]);

  const texto = busqueda.trim().toLowerCase();
  const visibles = (amigos || []).filter(
    (a) => !texto || a.nombre?.toLowerCase().includes(texto) || a.apodo?.toLowerCase().includes(texto)
  );

  function alternar(id) {
    setElegidos((actuales) => (actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]));
  }

  async function enviar() {
    setEnviando(true);
    const contenido = mensaje.trim() ? `${mensaje.trim()}\n${link}` : link;
    const resultados = await Promise.allSettled(elegidos.map((id) => chatsService.enviar(id, contenido)));
    setEnviando(false);
    const fallaron = resultados.filter((r) => r.status === "rejected").length;
    if (fallaron === resultados.length) {
      mostrarAviso("No se pudo enviar: " + resultados[0].reason.message);
      return;
    }
    mostrarAviso(fallaron > 0 ? `Enviado, pero a ${fallaron} no les llegó.` : "Enviado.", fallaron ? "error" : "exito");
    onCerrar();
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      mostrarAviso("Enlace copiado.", "exito");
    } catch {
      mostrarAviso("No se pudo copiar. El enlace es: " + link, "info");
    }
  }

  return (
    <div className="momentoModalFondo" role="dialog" aria-modal="true" aria-label="Compartir" onClick={() => !enviando && onCerrar()}>
      <div className="momentoModalCaja" onClick={(e) => e.stopPropagation()}>
        <header className="momentoModalHeader">
          <h2>Compartir</h2>
          <button type="button" className="momentoModalCerrar" onClick={onCerrar} disabled={enviando} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </header>

        <div className="momentoModalCuerpo">
          <label className="momentoModalBuscador">
            <IconoBuscar />
            <input
              type="search"
              placeholder="Buscar amigos"
              aria-label="Buscar amigos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>

          {amigos === null && <p className="momentoModalAyuda">Cargando amigos…</p>}
          {amigos?.length === 0 && (
            <p className="momentoModalAyuda">Todavía no tenés amigos para mandarle. Podés copiar el enlace.</p>
          )}

          <ul className="momentoModalUsuarios">
            {visibles.map((a) => {
              const elegido = elegidos.includes(a.id_usuario);
              return (
                <li key={a.id_usuario}>
                  <label className={`momentoModalUsuario momentoModalElegible ${elegido ? "elegido" : ""}`}>
                    <input type="checkbox" checked={elegido} onChange={() => alternar(a.id_usuario)} />
                    <img src={a.fotoperfil || a.foto_perfil} alt="" />
                    <span>
                      <strong>{a.apodo || a.nombre}</strong>
                      <small>@{a.nombre}</small>
                    </span>
                    <span className="momentoModalCheck" aria-hidden="true" />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className="momentoModalPie">
          {elegidos.length > 0 && (
            <input
              className="momentoModalMensaje"
              type="text"
              maxLength={300}
              placeholder="Escribí un mensaje…"
              aria-label="Mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
          )}
          <div className="momentoModalBotones">
            <button type="button" className="momentoModalSecundario" onClick={copiar}>
              Copiar enlace
            </button>
            <button
              type="button"
              className="fmBotonPrimario"
              onClick={enviar}
              disabled={elegidos.length === 0 || enviando}
            >
              {enviando ? "Enviando…" : elegidos.length > 1 ? `Enviar a ${elegidos.length}` : "Enviar"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
