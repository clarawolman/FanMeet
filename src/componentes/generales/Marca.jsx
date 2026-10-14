import "./Marca.css";
import imLogo from "../../assets/imLogo.png";

// Marca de FanMeet: el logo + el nombre. Se usa en el sidebar, el header,
// el login y el registro.
export function IconoMarca({ className = "" }) {
  return <img className={`marcaIcono ${className}`} src={imLogo} alt="" draggable={false} />;
}

export default function Marca({ className = "", conTexto = true, as: Etiqueta = "span" }) {
  return (
    <Etiqueta className={`marca ${className}`}>
      <IconoMarca />
      {conTexto && <span className="marcaTexto">FanMeet</span>}
    </Etiqueta>
  );
}
