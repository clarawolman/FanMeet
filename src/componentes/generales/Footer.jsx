import { useEffect, useState } from "react";
import "./Footer.css";
import MenuConfiguracion from "./MenuConfiguracion";
import { chatsService } from "../../services/chatsService";
import {
  IconoNavInicio,
  IconoNavDescubrir,
  IconoNavEventos,
  IconoNavGrupos,
  IconoNavChat,
  IconoNavPerfil,
  IconoNavConfiguracion,
} from "./iconosNav";

// En mobile la barra de abajo muestra solo Inicio, Eventos, Chat y Perfil;
// lo marcado como soloEscritorio queda en el menú lateral (MenuLateral).
const ITEMS = [
  { destino: "home", texto: "Inicio", Icono: IconoNavInicio },
  { destino: "descubrir", texto: "Descubrir", Icono: IconoNavDescubrir, soloEscritorio: true },
  { destino: "misEventos", texto: "Eventos", Icono: IconoNavEventos },
  { destino: "misGrupos", texto: "Grupos", Icono: IconoNavGrupos, soloEscritorio: true },
  { destino: "chats", texto: "Chat", Icono: IconoNavChat },
  { destino: "perfil", texto: "Perfil", Icono: IconoNavPerfil },
];

function Footer({ onNavegar, pantallaActiva, noLeidosChat }) {
  const [configAbierta, setConfigAbierta] = useState(false);
  const [noLeidosCargados, setNoLeidosCargados] = useState(0);

  // La pantalla de chats pasa su propio contador (se actualiza en tiempo
  // real); en el resto de las pantallas se pide una vez al montar.
  useEffect(() => {
    if (noLeidosChat !== undefined) return;
    chatsService
      .contarNoLeidos()
      .then((data) => setNoLeidosCargados(data?.total || 0))
      .catch(() => {});
  }, [noLeidosChat]);

  const noLeidos = noLeidosChat ?? noLeidosCargados;

  function navegar(destino) {
    if (pantallaActiva === destino) return;
    onNavegar(destino);
  }

  return (
    <>
      <nav className="footer">
        {ITEMS.map(({ destino, texto, Icono, soloEscritorio }) => {
          const activo = pantallaActiva === destino;
          const badge = destino === "chats" && noLeidos > 0 ? noLeidos : null;

          return (
            <button
              key={destino}
              className={`footerButton ${activo ? "activo" : ""} ${soloEscritorio ? "footerButton--escritorio" : ""}`}
              type="button"
              onClick={() => navegar(destino)}
              aria-current={activo ? "page" : undefined}
            >
              <span className="footerButtonChip">
                <Icono className="footerButtonIcono" />
                {badge && (
                  <span className="footerButtonBadge" aria-label={`${badge} mensajes sin leer`}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span className="footerButtonTexto">{texto}</span>
            </button>
          );
        })}

        <button
          className={`footerButton footerButton--escritorio ${configAbierta ? "activo" : ""}`}
          type="button"
          onClick={() => setConfigAbierta(true)}
        >
          <span className="footerButtonChip">
            <IconoNavConfiguracion className="footerButtonIcono" />
          </span>
          <span className="footerButtonTexto">Configuración</span>
        </button>
      </nav>

      <MenuConfiguracion abierto={configAbierta} onCerrar={() => setConfigAbierta(false)} />
    </>
  );
}

export default Footer;
