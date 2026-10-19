import "./CardEstadio.css";
import { IconoUbicacion } from "../generales/iconosTarjeta";

const FOTO_ESTADIO_DEFAULT = "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&q=80";

function CardEstadio({ estadio }) {
  const direccion = [estadio?.direccion, estadio?.ciudad].filter(Boolean).join(", ");
  const busqueda = [estadio?.nombre, direccion].filter(Boolean).join(", ");
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}`;

  return (
    <section className="EstadioCard">
      <img
        className="EstadioImagen"
        src={estadio?.imagen || estadio?.venueImage || FOTO_ESTADIO_DEFAULT}
        alt=""
      />

      <div className="EstadioContenido">
        <p className="EstadioEtiqueta">Dónde</p>
        <h3 className="EstadioNombre">{estadio?.nombre || "Estadio a confirmar"}</h3>
        {direccion && <p className="EstadioDireccion">{direccion}</p>}

        {busqueda && (
          <a className="EstadioMapa" href={mapa} target="_blank" rel="noreferrer">
            <IconoUbicacion width="14" height="14" />
            Cómo llegar
          </a>
        )}
      </div>
    </section>
  );
}

export default CardEstadio;
