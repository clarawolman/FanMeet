import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./Chats.css";
import Footer from "../generales/Footer";
import "../generales/HeaderApp.css";
import { IconoNavMenu } from "../generales/iconosNav";
import { MenuLateralContext } from "../../context/MenuLateralContext";
import { chatsService } from "../../services/chatsService";
import { mensajesService } from "../../services/mensajesService";
import { supabase } from "../../supabase";
import { UsuarioContext } from "../../context/UsuarioContext";
import fotoDefault from "../../assets/fotoDefault.png";

const TAMANIO_PAGINA = 50;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024; // mismo límite que backend/src/middlewares/upload.js
const FOTO_GRUPO_DEFAULT = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&q=80";

// Hay dos tipos de chat en la lista:
//  - privado: con un amigo (tabla mensaje_privado, /api/chats/:idUsuario)
//  - grupo: el chat de cada grupo del que soy miembro (tabla mensaje_grupo,
//    /api/grupos/:idGrupo/mensajes). Existe desde que se crea el grupo.
function claveChat(tipo, id) {
  return `${tipo}-${id}`;
}

function claveDe(chat) {
  return chat.tipo === "grupo"
    ? claveChat("grupo", chat.grupo.id_grupo)
    : claveChat("privado", chat.usuario.id_usuario);
}

// Datos comunes para pintar un chat (lista y encabezado).
function datosDe(chat) {
  if (chat.tipo === "grupo") {
    return {
      tipo: "grupo",
      id: chat.grupo.id_grupo,
      nombre: chat.grupo.nombre,
      foto: chat.grupo.foto || FOTO_GRUPO_DEFAULT,
      usuarios: chat.grupo.usuarios || [],
      grupo: chat.grupo,
    };
  }
  return {
    tipo: "privado",
    id: chat.usuario.id_usuario,
    nombre: chat.usuario.nombre,
    foto: chat.usuario.foto_perfil || fotoDefault,
  };
}

// Quién mandó el mensaje, sea privado (id_emisor) o de grupo (id_usuario).
function autorDe(mensaje) {
  return mensaje.id_emisor ?? mensaje.id_usuario;
}

function esMismoDia(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function esAyer(fecha) {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return esMismoDia(fecha, ayer);
}

function formatearHora(iso) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// Hora en la lista de chats: hoy -> 14:32, ayer -> "Ayer", si no 11/08/26
function formatearFechaLista(iso) {
  const fecha = new Date(iso);
  if (esMismoDia(fecha, new Date())) return formatearHora(iso);
  if (esAyer(fecha)) return "Ayer";
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// Separador de días dentro de la conversación
function formatearSeparador(iso) {
  const fecha = new Date(iso);
  if (esMismoDia(fecha, new Date())) return "Hoy";
  if (esAyer(fecha)) return "Ayer";
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function textoPreview(mensaje) {
  if (mensaje.contenido) return mensaje.contenido;
  if (mensaje.imagen) return "📷 Foto";
  return "";
}

function IconoBuscar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function IconoEnviar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2z" />
    </svg>
  );
}

function IconoAdjuntar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m20.5 16-4.5-4.5L7 19" />
    </svg>
  );
}

function IconoVolver() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function IconoChatVacio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" />
      <path d="M8.5 10.5h7M8.5 13.5h4.5" />
    </svg>
  );
}

// ✓ enviado / ✓✓ leído (como WhatsApp). Solo en chats privados.
function Tildes({ leido }) {
  return (
    <span
      className={`chatsTildes ${leido ? "chatsTildes--leido" : ""}`}
      aria-label={leido ? "Leído" : "Enviado"}
      title={leido ? "Leído" : "Enviado"}
    >
      <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {leido ? (
          <>
            <path d="m1 6.5 3.2 3.2L11 2.5" />
            <path d="m7.5 9.2.5.5L15 2.5" />
          </>
        ) : (
          <path d="m3.5 6.5 3.2 3.2L13.5 2.5" />
        )}
      </svg>
    </span>
  );
}

function Chats({ onNavegar, onVerUsuario, onVerGrupo, chatInicial }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const { abrirMenu } = useContext(MenuLateralContext);
  const idYo = usuarioActual?.id_usuario;

  const [chats, setChats] = useState([]);
  const [cargandoChats, setCargandoChats] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // datosDe(chat) del chat abierto: { tipo, id, nombre, foto, usuarios?, grupo? }
  const [chatAbierto, setChatAbierto] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [hayMasViejos, setHayMasViejos] = useState(false);
  const [cargandoViejos, setCargandoViejos] = useState(false);

  const [texto, setTexto] = useState("");
  const [imagenAdjunta, setImagenAdjunta] = useState(null); // { archivo, preview }
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // Los handlers de Realtime se registran una sola vez: leen el chat
  // abierto y la lista desde refs para no quedar con valores viejos.
  const chatAbiertoRef = useRef(null);
  const chatsRef = useRef([]);
  const listaMensajesRef = useRef(null);
  const inputRef = useRef(null);
  const inputArchivoRef = useRef(null);
  // Qué hacer con el scroll después de actualizar los mensajes:
  // "abajo" (mensaje nuevo / chat recién abierto) o mantener la posición
  // al agregar mensajes viejos arriba.
  const scrollPendienteRef = useRef(null);

  useEffect(() => {
    chatAbiertoRef.current = chatAbierto;
  }, [chatAbierto]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    cargarChats(chatInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La URL de preview de la foto adjunta se libera al cambiarla o al salir.
  useEffect(() => {
    return () => {
      if (imagenAdjunta) URL.revokeObjectURL(imagenAdjunta.preview);
    };
  }, [imagenAdjunta]);

  // Realtime:
  //  - mensaje_privado: los que recibo, los que mando desde otro
  //    dispositivo y las tildes de leído (UPDATE de "leido").
  //  - mensaje_grupo: sin filtro, la RLS de supabase/mensajes_grupo.sql ya
  //    deja pasar solo los de grupos de los que soy miembro.
  useEffect(() => {
    if (!idYo) return undefined;

    const alInsertarPrivado = (payload) => procesarMensajeEntrante("privado", payload.new);
    const canal = supabase
      .channel(`chats-${idYo}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensaje_privado", filter: `id_receptor=eq.${idYo}` },
        alInsertarPrivado
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensaje_privado", filter: `id_emisor=eq.${idYo}` },
        alInsertarPrivado
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mensaje_privado", filter: `id_emisor=eq.${idYo}` },
        (payload) => procesarMensajeActualizado(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensaje_grupo" },
        (payload) => procesarMensajeEntrante("grupo", payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idYo]);

  useLayoutEffect(() => {
    const lista = listaMensajesRef.current;
    const pendiente = scrollPendienteRef.current;
    if (!lista || !pendiente) return;

    if (pendiente === "abajo") {
      lista.scrollTop = lista.scrollHeight;
    } else {
      // se agregaron mensajes viejos arriba: queda viendo lo mismo que antes
      lista.scrollTop = lista.scrollHeight - pendiente.altoPrevio + pendiente.scrollPrevio;
    }
    scrollPendienteRef.current = null;
  }, [mensajes, cargandoMensajes]);

  async function cargarChats(paraAbrir) {
    try {
      const data = (await chatsService.listar()) || [];
      setChats(data);
      chatsRef.current = data;

      if (paraAbrir) {
        const chat = data.find((c) => claveDe(c) === claveChat(paraAbrir.tipo, paraAbrir.id));
        if (chat) abrirChat(chat);
      }
    } catch (error) {
      // Si no se pudo cargar, se muestra como vacío: sin errores técnicos.
      console.error("Error cargando chats:", error);
      setChats([]);
      chatsRef.current = [];
    }
    setCargandoChats(false);
  }

  function marcarLeido(tipo, id) {
    const promesa =
      tipo === "grupo" ? chatsService.marcarGrupoLeido(id) : chatsService.marcarLeidos(id);
    promesa.catch(() => {});
  }

  // Mensaje nuevo (mío o de otro) en cualquiera de los dos tipos de chat.
  function procesarMensajeEntrante(tipo, filaMensaje) {
    const esPropio = autorDe(filaMensaje) === idYo;
    const idChat =
      tipo === "grupo"
        ? filaMensaje.id_grupo
        : esPropio
          ? filaMensaje.id_receptor
          : filaMensaje.id_emisor;
    const clave = claveChat(tipo, idChat);
    const chatExistente = chatsRef.current.find((c) => claveDe(c) === clave);

    // Chat que todavía no estaba en la lista (amigo o grupo nuevo): se
    // recarga entera.
    if (!chatExistente) {
      cargarChats();
      return;
    }

    // El evento realtime de mensaje_grupo no trae nombre/foto del autor:
    // se buscan entre los miembros del grupo, que vienen con la lista.
    let mensaje = filaMensaje;
    if (tipo === "grupo" && !filaMensaje.usuario) {
      const autor = (chatExistente.grupo.usuarios || []).find((u) => u.id_usuario === filaMensaje.id_usuario);
      mensaje = {
        ...filaMensaje,
        usuario: autor || { id_usuario: filaMensaje.id_usuario, nombre: "Usuario", foto_perfil: fotoDefault },
      };
    }

    const abierto = chatAbiertoRef.current;
    const estaAbierto = abierto && claveChat(abierto.tipo, abierto.id) === clave;

    if (estaAbierto) {
      agregarMensaje(mensaje);
      if (!esPropio) marcarLeido(tipo, idChat);
    }

    setChats((actuales) => {
      const chat = actuales.find((c) => claveDe(c) === clave);
      if (!chat) return actuales;
      const actualizado = {
        ...chat,
        ultimoMensaje: mensaje,
        noLeidos: !esPropio && !estaAbierto ? chat.noLeidos + 1 : chat.noLeidos,
      };
      return [actualizado, ...actuales.filter((c) => c !== chat)];
    });
  }

  // El otro leyó mis mensajes privados: pasan a ✓✓.
  function procesarMensajeActualizado(mensaje) {
    const abierto = chatAbiertoRef.current;
    if (abierto?.tipo === "privado") {
      setMensajes((actuales) =>
        actuales.map((m) => (m.id_mensaje === mensaje.id_mensaje ? { ...m, leido: mensaje.leido } : m))
      );
    }
    setChats((actuales) =>
      actuales.map((c) =>
        c.tipo === "privado" && c.ultimoMensaje?.id_mensaje === mensaje.id_mensaje
          ? { ...c, ultimoMensaje: { ...c.ultimoMensaje, leido: mensaje.leido } }
          : c
      )
    );
  }

  // El mismo mensaje puede llegar dos veces (respuesta del POST + evento
  // realtime); se ignora el segundo por id_mensaje.
  function agregarMensaje(nuevo) {
    scrollPendienteRef.current = "abajo";
    setMensajes((actuales) => {
      if (actuales.some((m) => m.id_mensaje === nuevo.id_mensaje)) return actuales;
      return [...actuales, nuevo];
    });
  }

  function quitarImagenAdjunta() {
    setImagenAdjunta(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  }

  function pedirMensajes(abierto, opciones) {
    return abierto.tipo === "grupo"
      ? mensajesService.listar(abierto.id, opciones)
      : chatsService.listarMensajes(abierto.id, opciones);
  }

  async function abrirChat(chat) {
    const datos = datosDe(chat);
    const clave = claveDe(chat);

    setChatAbierto(datos);
    chatAbiertoRef.current = datos;
    setMensajes([]);
    setHayMasViejos(false);
    setTexto("");
    quitarImagenAdjunta();
    setErrorEnvio("");
    setCargandoMensajes(true);
    setChats((actuales) => actuales.map((c) => (claveDe(c) === clave ? { ...c, noLeidos: 0 } : c)));

    try {
      const data = (await pedirMensajes(datos)) || [];
      // los privados se marcan como leídos al pedirlos; los de grupo, aparte
      if (datos.tipo === "grupo") marcarLeido("grupo", datos.id);

      // si mientras cargaba se abrió otro chat, se descarta
      const abierto = chatAbiertoRef.current;
      if (abierto && claveChat(abierto.tipo, abierto.id) === clave) {
        scrollPendienteRef.current = "abajo";
        setMensajes(data);
        setHayMasViejos(data.length === TAMANIO_PAGINA);
      }
    } catch (error) {
      console.error("Error cargando mensajes:", error);
      setErrorEnvio(error.message || "No se pudieron cargar los mensajes");
    }
    setCargandoMensajes(false);
    inputRef.current?.focus();
  }

  // Paginación: al llegar arriba de todo se traen los 50 anteriores.
  async function cargarMensajesViejos() {
    if (!chatAbierto || !hayMasViejos || cargandoViejos || mensajes.length === 0) return;

    const abiertoAlPedir = chatAbierto;
    setCargandoViejos(true);

    try {
      const viejos =
        (await pedirMensajes(abiertoAlPedir, {
          antesDe: mensajes[0].id_mensaje,
          limite: TAMANIO_PAGINA,
        })) || [];

      if (chatAbiertoRef.current === abiertoAlPedir) {
        const lista = listaMensajesRef.current;
        scrollPendienteRef.current = {
          altoPrevio: lista?.scrollHeight || 0,
          scrollPrevio: lista?.scrollTop || 0,
        };
        setMensajes((actuales) => [...viejos, ...actuales]);
        setHayMasViejos(viejos.length === TAMANIO_PAGINA);
      }
    } catch (error) {
      console.error("Error cargando mensajes anteriores:", error);
    }
    setCargandoViejos(false);
  }

  function manejarScrollMensajes(evento) {
    if (evento.currentTarget.scrollTop < 80) cargarMensajesViejos();
  }

  // Una foto que termina de cargar cambia la altura: si estaba viendo lo
  // último, se sigue viendo lo último.
  function manejarImagenCargada(evento) {
    const lista = listaMensajesRef.current;
    if (!lista) return;
    const alto = evento.currentTarget.offsetHeight;
    const distanciaAlFondo = lista.scrollHeight - lista.scrollTop - lista.clientHeight;
    if (distanciaAlFondo <= alto + 120) lista.scrollTop = lista.scrollHeight;
  }

  function cerrarChat() {
    setChatAbierto(null);
    chatAbiertoRef.current = null;
    setMensajes([]);
    quitarImagenAdjunta();
  }

  function manejarArchivoElegido(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      setErrorEnvio("Solo se pueden mandar fotos jpg, png o webp");
      evento.target.value = "";
      return;
    }
    if (archivo.size > MAX_IMAGEN_BYTES) {
      setErrorEnvio("La foto no puede pesar más de 5 MB");
      evento.target.value = "";
      return;
    }

    setErrorEnvio("");
    setImagenAdjunta({ archivo, preview: URL.createObjectURL(archivo) });
    inputRef.current?.focus();
  }

  async function manejarEnviar(evento) {
    evento.preventDefault();
    const contenido = texto.trim();
    if ((!contenido && !imagenAdjunta) || enviando || !chatAbierto) return;

    setEnviando(true);
    setErrorEnvio("");

    try {
      if (chatAbierto.tipo === "grupo") {
        const mensajeCreado = await mensajesService.enviar(chatAbierto.id, contenido);
        procesarMensajeEntrante("grupo", mensajeCreado);
      } else {
        const mensajeCreado = await chatsService.enviar(chatAbierto.id, contenido, imagenAdjunta?.archivo);
        procesarMensajeEntrante("privado", mensajeCreado);
      }
      setTexto("");
      quitarImagenAdjunta();
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setErrorEnvio(error.message || "No se pudo enviar el mensaje");
    }

    setEnviando(false);
    inputRef.current?.focus();
  }

  const chatsFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return chats;
    return chats.filter((c) => datosDe(c).nombre.toLowerCase().includes(termino));
  }, [chats, busqueda]);

  const totalNoLeidos = chats.reduce((total, c) => total + c.noLeidos, 0);
  const esGrupoAbierto = chatAbierto?.tipo === "grupo";

  function renderMensajes() {
    let diaAnterior = null;
    let autorAnterior = null;

    return mensajes.map((mensaje) => {
      const autor = autorDe(mensaje);
      const esPropio = autor === idYo;
      const dia = new Date(mensaje.created_at).toDateString();
      const mostrarSeparador = dia !== diaAnterior;
      // En grupos, nombre y foto solo en el primero de una seguidilla del
      // mismo autor (como WhatsApp).
      const primeroDelAutor = mostrarSeparador || autor !== autorAnterior;
      diaAnterior = dia;
      autorAnterior = autor;

      const mostrarAutor = esGrupoAbierto && !esPropio;

      return (
        <div key={mensaje.id_mensaje} className="chatsMensajeFila">
          {mostrarSeparador && (
            <div className="chatsSeparadorDia">
              <span>{formatearSeparador(mensaje.created_at)}</span>
            </div>
          )}
          <div className={`chatsMensajeLinea ${esPropio ? "chatsMensajeLinea--propia" : ""}`}>
            {mostrarAutor &&
              (primeroDelAutor ? (
                <img
                  className="chatsAutorFoto"
                  src={mensaje.usuario?.foto_perfil || fotoDefault}
                  alt={mensaje.usuario?.nombre || "Usuario"}
                />
              ) : (
                <span className="chatsAutorFoto chatsAutorFoto--hueco" />
              ))}
            <div
              className={`chatsBurbuja ${esPropio ? "chatsBurbuja--propia" : ""} ${
                mensaje.imagen ? "chatsBurbuja--imagen" : ""
              }`}
            >
              {mostrarAutor && primeroDelAutor && (
                <span className="chatsBurbujaAutor">{mensaje.usuario?.nombre || "Usuario"}</span>
              )}
              {mensaje.imagen && (
                <button
                  type="button"
                  className="chatsBurbujaFoto"
                  onClick={() => setImagenAmpliada(mensaje.imagen)}
                  aria-label="Ver foto"
                >
                  <img src={mensaje.imagen} alt="Foto" onLoad={manejarImagenCargada} />
                </button>
              )}
              {mensaje.contenido && <p className="chatsBurbujaTexto">{mensaje.contenido}</p>}
              <span className="chatsBurbujaHora">
                {formatearHora(mensaje.created_at)}
                {esPropio && !esGrupoAbierto && <Tildes leido={mensaje.leido} />}
              </span>
            </div>
          </div>
        </div>
      );
    });
  }

  function renderPreview(chat) {
    const { ultimoMensaje } = chat;
    if (!ultimoMensaje) {
      return chat.tipo === "grupo" ? "Grupo creado. ¡Saludá al grupo!" : "Empezá a chatear";
    }

    const esPropio = autorDe(ultimoMensaje) === idYo;
    if (chat.tipo === "grupo") {
      const quien = esPropio ? "Vos" : ultimoMensaje.usuario?.nombre || "Alguien";
      return `${quien}: ${textoPreview(ultimoMensaje)}`;
    }
    return (
      <>
        {esPropio && <Tildes leido={ultimoMensaje.leido} />}
        {`${esPropio ? "Vos: " : ""}${textoPreview(ultimoMensaje)}`}
      </>
    );
  }

  function manejarClickEncabezado() {
    if (!chatAbierto) return;
    if (chatAbierto.tipo === "grupo") onVerGrupo?.(chatAbierto.grupo);
    else onVerUsuario?.(chatAbierto.id);
  }

  return (
    <div className={`pantallaChats ${chatAbierto ? "pantallaChats--conversacion" : ""}`}>
      <div className="chatsLayout">
        {/* ===== LISTA DE CHATS ===== */}
        <aside className="chatsLista">
          <header className="chatsListaHeader">
            <div className="chatsListaTitulo">
              <h1>Chats</h1>
              <button type="button" className="headerAppMenu" onClick={abrirMenu} aria-label="Abrir menú">
                <IconoNavMenu />
              </button>
            </div>
            <label className="chatsBuscador">
              <IconoBuscar />
              <input
                type="search"
                placeholder="Buscar un amigo o grupo"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>
          </header>

          <div className="chatsListaItems">
            {cargandoChats && <p className="chatsListaEstado">Cargando chats...</p>}

            {!cargandoChats && chats.length === 0 && (
              <p className="chatsListaEstado">No tenés chats.</p>
            )}

            {!cargandoChats && chats.length > 0 && chatsFiltrados.length === 0 && (
              <p className="chatsListaEstado">No hay chats con ese nombre.</p>
            )}

            {chatsFiltrados.map((chat) => {
              const datos = datosDe(chat);
              const clave = claveDe(chat);
              const activo = chatAbierto && claveChat(chatAbierto.tipo, chatAbierto.id) === clave;
              const { ultimoMensaje, noLeidos } = chat;

              return (
                <button
                  key={clave}
                  type="button"
                  className={`chatsItem ${activo ? "chatsItem--activo" : ""}`}
                  onClick={() => abrirChat(chat)}
                >
                  <img
                    className={`chatsAvatar ${datos.tipo === "grupo" ? "chatsAvatar--grupo" : ""}`}
                    src={datos.foto}
                    alt={datos.nombre}
                  />
                  <span className="chatsItemTexto">
                    <span className="chatsItemFila">
                      <span className="chatsItemNombre">{datos.nombre}</span>
                      {ultimoMensaje && (
                        <span className={`chatsItemHora ${noLeidos > 0 ? "chatsItemHora--nuevo" : ""}`}>
                          {formatearFechaLista(ultimoMensaje.created_at)}
                        </span>
                      )}
                    </span>
                    <span className="chatsItemFila">
                      <span className="chatsItemPreview">{renderPreview(chat)}</span>
                      {noLeidos > 0 && <span className="chatsItemBadge">{noLeidos}</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ===== CONVERSACIÓN ===== */}
        <section className="chatsConversacion">
          {!chatAbierto ? (
            <div className="chatsVacio">
              <IconoChatVacio />
              <h2>FanMeet Chat</h2>
              <p>Elegí un chat de la lista: tus amigos y tus grupos están acá.</p>
            </div>
          ) : (
            <>
              <header className="chatsConversacionHeader">
                <button type="button" className="chatsVolver" onClick={cerrarChat} aria-label="Volver a los chats">
                  <IconoVolver />
                </button>
                <button type="button" className="chatsConversacionPerfil" onClick={manejarClickEncabezado}>
                  <img
                    className={`chatsAvatar chatsAvatar--chico ${esGrupoAbierto ? "chatsAvatar--grupo" : ""}`}
                    src={chatAbierto.foto}
                    alt={chatAbierto.nombre}
                  />
                  <span className="chatsConversacionTexto">
                    <span className="chatsConversacionNombre">{chatAbierto.nombre}</span>
                    {esGrupoAbierto && (
                      <span className="chatsConversacionSubtitulo">
                        {chatAbierto.usuarios
                          .map((u) => (u.id_usuario === idYo ? "Vos" : u.nombre))
                          .join(", ")}
                      </span>
                    )}
                  </span>
                </button>
              </header>

              <div className="chatsMensajes" ref={listaMensajesRef} onScroll={manejarScrollMensajes}>
                {cargandoViejos && <p className="chatsCargandoViejos">Cargando mensajes anteriores...</p>}

                {cargandoMensajes && <p className="chatsMensajesEstado">Cargando mensajes...</p>}

                {!cargandoMensajes && mensajes.length === 0 && (
                  <p className="chatsMensajesEstado">
                    {esGrupoAbierto
                      ? `Este es el chat del grupo ${chatAbierto.nombre}. ¡Mandá el primer mensaje!`
                      : `Todavía no hay mensajes. ¡Mandale el primero a ${chatAbierto.nombre}!`}
                  </p>
                )}

                {!cargandoMensajes && renderMensajes()}
              </div>

              {errorEnvio && <p className="chatsError">{errorEnvio}</p>}

              {imagenAdjunta && (
                <div className="chatsAdjunto">
                  <img src={imagenAdjunta.preview} alt="Foto a enviar" />
                  <span>Agregá un mensaje si querés y tocá enviar</span>
                  <button type="button" onClick={quitarImagenAdjunta} aria-label="Quitar foto">
                    ✕
                  </button>
                </div>
              )}

              <form className="chatsForm" onSubmit={manejarEnviar}>
                {/* El chat de grupo (mensaje_grupo) es solo texto */}
                {!esGrupoAbierto && (
                  <>
                    <input
                      ref={inputArchivoRef}
                      type="file"
                      accept={TIPOS_IMAGEN.join(",")}
                      onChange={manejarArchivoElegido}
                      hidden
                    />
                    <button
                      type="button"
                      className="chatsBotonAdjuntar"
                      onClick={() => inputArchivoRef.current?.click()}
                      disabled={enviando}
                      aria-label="Mandar una foto"
                    >
                      <IconoAdjuntar />
                    </button>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escribí un mensaje"
                  maxLength={2000}
                  disabled={enviando}
                />
                <button
                  type="submit"
                  className="chatsBotonEnviar"
                  disabled={enviando || (!texto.trim() && !imagenAdjunta)}
                  aria-label="Enviar"
                >
                  <IconoEnviar />
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {imagenAmpliada && (
        <div className="chatsVisor" onClick={() => setImagenAmpliada(null)}>
          <button type="button" className="chatsVisorCerrar" aria-label="Cerrar">
            ✕
          </button>
          <img src={imagenAmpliada} alt="Foto" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <Footer onNavegar={onNavegar} pantallaActiva="chats" noLeidosChat={totalNoLeidos} />
    </div>
  );
}

export default Chats;
