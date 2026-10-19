import { useState } from "react";
import "./proximosConciertosPerfil.css";
import { IconoSiguiente } from "../generales/iconosNav";
import { separarProximosYPasados } from "../../utils/fechas";

const MAX_VISIBLES = 3;

function formatearFecha(fecha) {
  if (!fecha) return "Fecha a confirmar";

  const fechaObjeto = new Date(fecha);
  if (Number.isNaN(fechaObjeto.getTime())) return "Fecha a confirmar";

  return fechaObjeto.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: fechaObjeto.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function ItemConcierto({ evento, onVerConcierto }) {
  const artista = evento.artista?.nombre || evento.nombre || "Artista";
  const lugar = evento.estadio?.nombre || evento.estadio?.ciudad || "";
  const contenido = (
    <>
      <img
        className="proximoConciertoImagen"
        src={evento.imagen || evento.imagenConcierto || evento.foto || ""}
        alt={artista}
      />

      <span className="proximoConciertoInfo">
        <strong>{artista}</strong>
        <small>
          <span className="proximoConciertoFecha">{formatearFecha(evento.fecha)}</span>
          {lugar ? ` · ${lugar}` : ""}
        </small>
      </span>
    </>
  );

  // En un perfil ajeno no se puede entrar: solo pueden ver el concierto
  // los que están unidos.
  if (!onVerConcierto) {
    return <div className="proximoConciertoItem proximoConciertoItem--fijo">{contenido}</div>;
  }

  return (
    <button className="proximoConciertoItem" type="button" onClick={() => onVerConcierto(evento)}>
      {contenido}
      <span className="proximoConciertoFlecha"><IconoSiguiente width="14" height="14" /></span>
    </button>
  );
}

function SeccionConciertos({ titulo, eventos, vacio, onVerConcierto }) {
  const [verTodos, setVerTodos] = useState(false);
  const visibles = verTodos ? eventos : eventos.slice(0, MAX_VISIBLES);

  return (
    <div className="proximosConciertosPerfilSeccion">
      <div className="proximosConciertosPerfilHeader">
        <h3>{titulo}</h3>

        {eventos.length > MAX_VISIBLES && (
          <button
            className="proximosConciertosPerfilVerTodos"
            type="button"
            onClick={() => setVerTodos((v) => !v)}
          >
            {verTodos ? "Ver menos" : `Ver todos (${eventos.length})`}
          </button>
        )}
      </div>

      {eventos.length === 0 ? (
        vacio
      ) : (
        <div className="proximosConciertosPerfilLista">
          {visibles.map((evento) => (
            <ItemConcierto key={evento.id_concierto} evento={evento} onVerConcierto={onVerConcierto} />
          ))}
        </div>
      )}
    </div>
  );
}

// Conciertos del perfil: próximos e historial. Se muestran en cualquier
// perfil; solo en el propio se puede entrar a cada concierto.
export default function ProximosConciertosPerfil({
  eventos,
  cargando,
  isOwnProfile,
  onVerConcierto,
  onDescubrir,
}) {
  if (cargando) return null;

  const { proximos, pasados } = separarProximosYPasados(eventos);
  const alEntrar = isOwnProfile ? onVerConcierto : undefined;

  return (
    <section className="proximosConciertosPerfil">
      <SeccionConciertos
        titulo="Próximos conciertos"
        eventos={proximos}
        onVerConcierto={alEntrar}
        vacio={
          <div className="proximosConciertosPerfilVacio">
            <p>
              {isOwnProfile
                ? "Todavía no tenés conciertos próximos."
                : "No tiene conciertos próximos."}
            </p>

            {isOwnProfile && (
              <button
                className="proximosConciertosPerfilDescubrir"
                type="button"
                onClick={onDescubrir}
              >
                Descubrir conciertos
              </button>
            )}
          </div>
        }
      />

      {pasados.length > 0 && (
        <SeccionConciertos
          titulo="Historial de conciertos"
          eventos={pasados}
          onVerConcierto={alEntrar}
        />
      )}
    </section>
  );
}
