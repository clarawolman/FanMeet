import { useContext, useState } from "react";
import "./FansUnidosLista.css";
import HeaderApp from "../generales/HeaderApp";
import Footer from "../generales/Footer";
import { UsuarioContext } from "../../context/UsuarioContext";
import { amistadService } from "../../services/amistadService";

// "21 años · En 1 grupo" (cada parte solo si el dato viene)
function detalleFan(fan) {
  const partes = [];
  if (fan.edad != null) partes.push(`${fan.edad} años`);
  if (fan.cantidadGrupos !== undefined) {
    partes.push(
      fan.cantidadGrupos === 0
        ? "Sin grupos"
        : `En ${fan.cantidadGrupos} ${fan.cantidadGrupos === 1 ? "grupo" : "grupos"}`
    );
  }
  return partes.join(" · ");
}

function FansUnidosLista({
  fans = [],
  cantidadFans = 0,
  onVolver,
  onVerUsuario,
  onCambioAmistad,
  onEnviarMensaje,
  onNavegar,
  titulo = "Fans unidos",
  subtitulo = `${cantidadFans} personas van a este concierto`,
}) {
  // La lista es para conocer a otros fans: uno mismo no tiene que aparecer ahí.
  const { usuarioActual } = useContext(UsuarioContext);
  const otrosFans = fans.filter(
    (fan) => fan.id_usuario !== usuarioActual?.id_usuario
  );

  // id_usuario del fan cuya solicitud se está enviando/aceptando
  const [procesando, setProcesando] = useState(null);

  async function conectar(fan) {
    setProcesando(fan.id_usuario);
    try {
      const amistad = await amistadService.crearSolicitud(fan.id_usuario);
      onCambioAmistad?.(fan.id_usuario, {
        estadoAmistad: "solicitudEnviada",
        idAmistad: amistad?.id_amistad ?? null,
      });
    } catch (error) {
      alert("No se pudo enviar la solicitud: " + error.message);
    }
    setProcesando(null);
  }

  async function aceptar(fan) {
    setProcesando(fan.id_usuario);
    try {
      await amistadService.aceptar(fan.idAmistad);
      onCambioAmistad?.(fan.id_usuario, { estadoAmistad: "amigos" });
    } catch (error) {
      alert("No se pudo aceptar la solicitud: " + error.message);
    }
    setProcesando(null);
  }

  function renderAmistad(fan) {
    const ocupado = procesando === fan.id_usuario;

    switch (fan.estadoAmistad) {
      case "amigos":
        return (
          <span className="fanUnidoAcciones">
            <span className="fanUnidoEstado fanUnidoEstado--amigos">Amigos</span>
            {onEnviarMensaje && (
              <button
                type="button"
                className="fanUnidoAccion"
                onClick={() => onEnviarMensaje(fan.id_usuario)}
              >
                Mensaje
              </button>
            )}
          </span>
        );
      case "solicitudEnviada":
        return <span className="fanUnidoEstado">Pendiente</span>;
      case "aceptarSolicitud":
        return (
          <button
            type="button"
            className="fanUnidoAccion"
            disabled={ocupado || !fan.idAmistad}
            onClick={() => aceptar(fan)}
          >
            {ocupado ? "..." : "Aceptar"}
          </button>
        );
      case "conectar":
        return (
          <button
            type="button"
            className="fanUnidoAccion"
            disabled={ocupado}
            onClick={() => conectar(fan)}
          >
            {ocupado ? "..." : "Conectar"}
          </button>
        );
      default:
        return null;
    }
  }

  return (
    <div className="fansUnidosLista">
      <HeaderApp onVolver={onVolver} titulo={titulo} subtitulo={subtitulo} />

      <main className="fansUnidosListaMain">
        {otrosFans.length === 0 && (
          <p className="fansUnidosListaVacio">Todavía no hay nadie más confirmado.</p>
        )}

        {otrosFans.map((fan) => (
          <div key={fan.id_usuario} className="fanUnidoCard">
            <button
              className="fanUnidoPerfil"
              type="button"
              onClick={() => onVerUsuario(fan.id_usuario)}
            >
              <img
                className="fanUnidoFoto"
                src={fan.foto_perfil}
                alt={fan.nombre}
              />
              <span className="fanUnidoTexto">
                <span className="fanUnidoNombre">{fan.nombre}</span>
                {detalleFan(fan) && (
                  <span className="fanUnidoGrupos">{detalleFan(fan)}</span>
                )}
              </span>
            </button>

            {renderAmistad(fan)}
          </div>
        ))}
      </main>

      {onNavegar && <Footer onNavegar={onNavegar} />}
    </div>
  );
}

export default FansUnidosLista;
