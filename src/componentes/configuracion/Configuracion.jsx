import { useContext, useState } from "react";
import "./Configuracion.css";
import HeaderApp from "../generales/HeaderApp";
import Footer from "../generales/Footer";
import { UsuarioContext } from "../../context/UsuarioContext";
import { usuariosService } from "../../services/usuariosService";
import { mostrarAviso } from "../../utils/avisos";
import { IconoSiguiente } from "../generales/iconosNav";
import SeccionCuenta from "./SeccionCuenta";
import SeccionPrivacidad from "./SeccionPrivacidad";
import SeccionNotificaciones from "./SeccionNotificaciones";
import SeccionMusica from "./SeccionMusica";
import SeccionApariencia from "./SeccionApariencia";
import SeccionAyuda from "./SeccionAyuda";
import {
  IconoApariencia,
  IconoAyuda,
  IconoCuenta,
  IconoMusica,
  IconoNotificaciones,
  IconoPrivacidad,
} from "./iconosConfig";

// Mismos valores por defecto que el backend (helpers/preferencias.js): si
// el backend todavía no manda preferencias, la pantalla igual funciona.
const PREFERENCIAS_DEFAULT = {
  perfil_privado: false,
  mensajes: "amigos",
  etiquetas: "amigos",
  mostrar_conciertos: true,
  aparecer_en_descubrir: true,
  mostrar_musica: true,
  ocultar_likes: false,
  notificaciones: { amistad: true, mensajes: true, momentos: true, grupos: true, conciertos: true },
  recordatorio_dias: [0],
  fani: true,
};

const SECCIONES = [
  {
    id: "cuenta",
    titulo: "Cuenta",
    descripcion: "Mail, contraseña y sesión",
    Icono: IconoCuenta,
    Componente: SeccionCuenta,
  },
  {
    id: "privacidad",
    titulo: "Privacidad",
    descripcion: "Quién ve tu perfil y quién te escribe",
    Icono: IconoPrivacidad,
    Componente: SeccionPrivacidad,
  },
  {
    id: "notificaciones",
    titulo: "Notificaciones",
    descripcion: "Qué avisos te llegan y recordatorios",
    Icono: IconoNotificaciones,
    Componente: SeccionNotificaciones,
  },
  {
    id: "musica",
    titulo: "Música y zona",
    descripcion: "Tu ciudad, gustos y Last.fm",
    Icono: IconoMusica,
    Componente: SeccionMusica,
  },
  {
    id: "apariencia",
    titulo: "Apariencia y Fani",
    descripcion: "Tema, tamaño del texto y la asistente",
    Icono: IconoApariencia,
    Componente: SeccionApariencia,
  },
  {
    id: "ayuda",
    titulo: "Ayuda",
    descripcion: "Contactanos, preguntas y legales",
    Icono: IconoAyuda,
    Componente: SeccionAyuda,
  },
];

const esEscritorio = () =>
  window.matchMedia?.("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches ?? false;

export default function Configuracion({ onNavegar, onVolver }) {
  const { usuarioActual, setUsuarioActual } = useContext(UsuarioContext);
  // En el celular arranca en la lista de secciones; en escritorio, en Cuenta.
  const [seccion, setSeccion] = useState(() => (esEscritorio() ? "cuenta" : null));

  const guardadas = usuarioActual?.preferencias || {};
  const preferencias = {
    ...PREFERENCIAS_DEFAULT,
    ...guardadas,
    notificaciones: { ...PREFERENCIAS_DEFAULT.notificaciones, ...guardadas.notificaciones },
  };

  // Se ve el cambio al toque y se guarda de fondo; si falla, vuelve atrás.
  async function guardarPreferencias(cambios) {
    const anterior = usuarioActual;
    setUsuarioActual({
      ...usuarioActual,
      preferencias: {
        ...preferencias,
        ...cambios,
        notificaciones: { ...preferencias.notificaciones, ...cambios.notificaciones },
      },
    });
    try {
      const actualizado = await usuariosService.actualizarPreferencias(cambios);
      setUsuarioActual((actual) => ({ ...actual, preferencias: actualizado.preferencias }));
    } catch (error) {
      setUsuarioActual(anterior);
      mostrarAviso("No se pudo guardar: " + error.message);
    }
  }

  const actual = SECCIONES.find((s) => s.id === seccion);
  const enLista = !actual;

  return (
    <div className="pantallaConfiguracion">
      <HeaderApp
        titulo={actual && !esEscritorio() ? actual.titulo : "Configuración"}
        onVolver={actual && !esEscritorio() ? () => setSeccion(null) : onVolver}
      />

      <main className={`configLayout ${enLista ? "configLayout--lista" : ""}`}>
        <div className="configLateral">
          {/* quién sos: lleva al perfil */}
          <button type="button" className="configYo" onClick={() => onNavegar("perfil")}>
            <img src={usuarioActual?.fotoperfil} alt="" />
            <span className="configYoTexto">
              <strong>{usuarioActual?.apodo || usuarioActual?.nombre}</strong>
              <span>@{usuarioActual?.nombre} · Ver mi perfil</span>
            </span>
            <IconoSiguiente className="configNavFlecha" aria-hidden="true" />
          </button>

          <nav className="configNav" aria-label="Secciones de configuración">
            {SECCIONES.map(({ id, titulo, descripcion, Icono }) => (
              <button
                key={id}
                type="button"
                className={`configNavItem ${seccion === id ? "activo" : ""}`}
                onClick={() => setSeccion(id)}
                aria-current={seccion === id ? "page" : undefined}
              >
                <span className="configNavIcono" aria-hidden="true">
                  <Icono />
                </span>
                <span className="configNavTexto">
                  <strong>{titulo}</strong>
                  <span>{descripcion}</span>
                </span>
                <IconoSiguiente className="configNavFlecha" aria-hidden="true" />
              </button>
            ))}
          </nav>
        </div>

        {actual && (
          <div className="configContenido">
            <header className="configContenidoCabecera">
              <span className="configNavIcono configNavIcono--grande" aria-hidden="true">
                <actual.Icono />
              </span>
              <div>
                <h2 className="configContenidoTitulo">{actual.titulo}</h2>
                <p className="configContenidoDescripcion">{actual.descripcion}</p>
              </div>
            </header>
            <actual.Componente
              usuario={usuarioActual}
              preferencias={preferencias}
              onGuardarPreferencias={guardarPreferencias}
              onNavegar={onNavegar}
            />
          </div>
        )}
      </main>

      <Footer onNavegar={onNavegar} pantallaActiva="configuracion" />
    </div>
  );
}
