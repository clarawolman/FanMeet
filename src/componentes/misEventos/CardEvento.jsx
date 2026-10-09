import "../generales/TarjetaLista.css";
import { cuentaRegresiva, formatearFechaLarga } from "../../utils/fechas";
import { IconoCalendario, IconoUbicacion } from "../generales/iconosTarjeta";

const IMAGEN_DEFAULT = "https://placehold.co/900x500?text=Concierto";

function CardEvento({ evento, onIngresar, onSalir }) {
  const imagen = evento.imagen || evento.imagenConcierto || evento.foto || IMAGEN_DEFAULT;
  const artista = evento.artista?.nombre || "";
  const titulo = evento.nombre || artista || "Concierto";
  const lugar = [evento.estadio?.nombre, evento.estadio?.ciudad].filter(Boolean).join(", ");
  const falta = cuentaRegresiva(evento.fecha);

  return (
    <article className="tarjeta">
      <div className="tarjetaMedia">
        <img className="tarjetaImagen" src={imagen} alt="" />
        {falta && (
          <div className="tarjetaChips">
            <span className={`tarjetaChip ${falta === "Hoy" ? "tarjetaChip--fuerte" : ""}`}>
              {falta}
            </span>
          </div>
        )}
      </div>

      <div className="tarjetaCuerpo">
        <div className="tarjetaTitulos">
          <h2 className="tarjetaTitulo">{titulo}</h2>
          {artista && artista !== titulo && <p className="tarjetaSubtitulo">{artista}</p>}
        </div>

        <ul className="tarjetaMeta">
          {lugar && (
            <li>
              <IconoUbicacion />
              <span>{lugar}</span>
            </li>
          )}
          {evento.fecha && (
            <li>
              <IconoCalendario />
              <span>{formatearFechaLarga(evento.fecha)}</span>
            </li>
          )}
        </ul>

        <div className="tarjetaAcciones">
          {onSalir && (
            <button
              className="tarjetaBoton tarjetaBoton--secundario"
              type="button"
              onClick={() => onSalir(evento)}
            >
              Salir
            </button>
          )}
          <button className="tarjetaBoton" type="button" onClick={() => onIngresar(evento)}>
            Ingresar
          </button>
        </div>
      </div>
    </article>
  );
}

export default CardEvento;
