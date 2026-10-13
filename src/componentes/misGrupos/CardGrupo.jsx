import "../generales/TarjetaLista.css";
import { cuentaRegresiva, formatearFechaLarga } from "../../utils/fechas";
import { IconoCalendario, IconoReloj, IconoUbicacion } from "../generales/iconosTarjeta";

const FOTO_GRUPO_DEFAULT = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&q=80";
const MAX_AVATARES = 4;

const CATEGORIAS = {
  pre: "Pre-show",
  after: "After",
  mismo_dia: "Mismo día",
};

function CardGrupo({ grupo, onAbrirGrupo, onSalir }) {
  const usuarios = grupo.usuarios || [];
  const hora = grupo.hora ? String(grupo.hora).slice(0, 5) : "";
  const falta = cuentaRegresiva(grupo.fecha);

  return (
    <article className="tarjeta">
      <div className="tarjetaMedia">
        <img className="tarjetaImagen" src={grupo.foto || FOTO_GRUPO_DEFAULT} alt="" />
        <div className="tarjetaChips">
          {falta && (
            <span className={`tarjetaChip ${falta === "Hoy" ? "tarjetaChip--fuerte" : ""}`}>
              {falta}
            </span>
          )}
          <span className="tarjetaChip">{CATEGORIAS[grupo.categoria] || "Grupo"}</span>
        </div>
      </div>

      <div className="tarjetaCuerpo">
        <div className="tarjetaTitulos">
          <h2 className="tarjetaTitulo">{grupo.nombre}</h2>
        </div>

        <ul className="tarjetaMeta">
          {grupo.ubicacion && (
            <li>
              <IconoUbicacion />
              <span>{grupo.ubicacion}</span>
            </li>
          )}
          {grupo.fecha && (
            <li>
              <IconoCalendario />
              <span>{formatearFechaLarga(grupo.fecha)}</span>
            </li>
          )}
          {hora && (
            <li>
              <IconoReloj />
              <span>{hora} hs</span>
            </li>
          )}
        </ul>

        {usuarios.length > 0 && (
          <div className="tarjetaPersonas">
            <div className="tarjetaAvatares">
              {usuarios.slice(0, MAX_AVATARES).map((usuario) => (
                <img key={usuario.id_usuario} src={usuario.foto_perfil} alt={usuario.nombre} />
              ))}
            </div>
            <span>
              {usuarios.length} {usuarios.length === 1 ? "va" : "van"}
            </span>
          </div>
        )}

        <div className="tarjetaAcciones">
          {onSalir && (
            <button
              className="tarjetaBoton tarjetaBoton--secundario"
              type="button"
              onClick={() => onSalir(grupo)}
            >
              Salir
            </button>
          )}
          <button className="tarjetaBoton" type="button" onClick={() => onAbrirGrupo(grupo)}>
            Ver grupo
          </button>
        </div>
      </div>
    </article>
  );
}

export default CardGrupo;
