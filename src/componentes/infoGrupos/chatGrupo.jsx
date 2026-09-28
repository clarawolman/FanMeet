import { useEffect, useRef, useState } from "react";
import "./chatGrupo.css";
import HeaderGrupo from "./headerGrupo";
import { mensajesService } from "../../services/mensajesService";
import { supabase } from "../../supabase";
import fotoDefault from "../../assets/fotoDefault.png";

function usuarioPorId(grupo, idUsuario) {
  return (grupo.usuarios || []).find((u) => u.id_usuario === idUsuario);
}

function ChatGrupo({ grupo, usuarioActual, onVolver }) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const listaRef = useRef(null);

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo.id_grupo]);

  // Realtime via supabase-js directo: el envio pasa por el backend, pero
  // recibir mensajes nuevos (propios y de otros) se resuelve suscribiendose
  // a los inserts de "mensaje_grupo" habilitados en
  // supabase/mensajes_grupo.sql. La RLS de esa tabla exige ser miembro del
  // grupo, así que solo llegan mensajes de grupos a los que pertenece
  // usuarioActual.
  useEffect(() => {
    const canal = supabase
      .channel(`mensajes-grupo-${grupo.id_grupo}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensaje_grupo",
          filter: `id_grupo=eq.${grupo.id_grupo}`,
        },
        (payload) => agregarMensaje(mapearFilaRealtime(payload.new))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo.id_grupo]);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes]);

  // El evento realtime solo trae las columnas de la tabla (sin el join a
  // "usuario" que sí arma el backend), así que el nombre/foto del emisor se
  // busca en grupo.usuarios, que ya viaja con el grupo seleccionado.
  function mapearFilaRealtime(fila) {
    const usuario = usuarioPorId(grupo, fila.id_usuario);
    return {
      id_mensaje: fila.id_mensaje,
      id_grupo: fila.id_grupo,
      id_usuario: fila.id_usuario,
      contenido: fila.contenido,
      created_at: fila.created_at,
      usuario: usuario
        ? {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            foto_perfil: usuario.foto_perfil,
          }
        : { id_usuario: fila.id_usuario, nombre: "Usuario", foto_perfil: fotoDefault },
    };
  }

  // El mismo mensaje puede llegar dos veces (respuesta del POST + evento
  // realtime); se ignora el segundo por id_mensaje.
  function agregarMensaje(nuevo) {
    setMensajes((actuales) => {
      if (actuales.some((m) => m.id_mensaje === nuevo.id_mensaje)) return actuales;
      return [...actuales, nuevo];
    });
  }

  async function cargarHistorial() {
    setCargando(true);
    setError("");

    try {
      const data = await mensajesService.listar(grupo.id_grupo);
      setMensajes(data || []);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
      setError("No se pudieron cargar los mensajes");
    }

    setCargando(false);
  }

  async function manejarEnviar(evento) {
    evento.preventDefault();
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    setEnviando(true);
    setError("");

    try {
      const mensajeCreado = await mensajesService.enviar(grupo.id_grupo, contenido);
      agregarMensaje(mensajeCreado);
      setTexto("");
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError(err.message || "No se pudo enviar el mensaje");
    }

    setEnviando(false);
  }

  return (
    <div className="chatGrupo">
      <HeaderGrupo titulo={`Chat - ${grupo.nombre}`} onVolver={onVolver} />

      <div className="chatGrupoMensajes" ref={listaRef}>
        {cargando && <p className="chatGrupoEstado">Cargando mensajes...</p>}

        {!cargando && mensajes.length === 0 && (
          <p className="chatGrupoEstado">
            Todavía no hay mensajes. ¡Empezá la conversación!
          </p>
        )}

        {!cargando &&
          mensajes.map((mensaje) => {
            const esPropio = mensaje.id_usuario === usuarioActual.id_usuario;
            return (
              <div
                key={mensaje.id_mensaje}
                className={`chatGrupoMensaje${esPropio ? " chatGrupoMensajePropio" : ""}`}
              >
                {!esPropio && (
                  <img
                    className="chatGrupoAvatar"
                    src={mensaje.usuario?.foto_perfil || fotoDefault}
                    alt={mensaje.usuario?.nombre || "Usuario"}
                  />
                )}

                <div className="chatGrupoBurbuja">
                  {!esPropio && (
                    <span className="chatGrupoNombre">
                      {mensaje.usuario?.nombre || "Usuario"}
                    </span>
                  )}
                  <p className="chatGrupoContenido">{mensaje.contenido}</p>
                  <span className="chatGrupoHora">
                    {new Date(mensaje.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {error && <p className="chatGrupoError">{error}</p>}

      <form className="chatGrupoForm" onSubmit={manejarEnviar}>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un mensaje..."
          maxLength={2000}
          disabled={enviando}
        />
        <button type="submit" disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatGrupo;
