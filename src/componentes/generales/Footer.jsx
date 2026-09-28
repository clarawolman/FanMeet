import "./Footer.css";
import { IconoNavInicio, IconoNavEventos, IconoNavGrupos, IconoNavPerfil } from "./iconosNav";

const ITEMS = [
  { destino: "home", texto: "Inicio", Icono: IconoNavInicio },
  { destino: "misEventos", texto: "Eventos", Icono: IconoNavEventos },
  { destino: "misGrupos", texto: "Grupos", Icono: IconoNavGrupos },
  { destino: "perfil", texto: "Perfil", Icono: IconoNavPerfil },
];

function Footer({ onNavegar, pantallaActiva }) {
  function navegar(destino) {
    if (pantallaActiva === destino) return;
    onNavegar(destino);
  }

  return (
    <nav className="footer">
      {ITEMS.map(({ destino, texto, Icono }) => {
        const activo = pantallaActiva === destino;

        return (
          <button
            key={destino}
            className={`footerButton ${activo ? "activo" : ""}`}
            type="button"
            onClick={() => navegar(destino)}
            aria-current={activo ? "page" : undefined}
          >
            <span className="footerButtonChip">
              <Icono className="footerButtonIcono" />
            </span>
            <span className="footerButtonTexto">{texto}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default Footer;
