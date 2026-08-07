import "./botonAmistad.css";

const ESTADOS_AMISTAD = {
  conectar: { texto: "Conectar", clase: "conectar" },
  solicitudEnviada: { texto: "Solicitud enviada", clase: "enviada" },
  aceptarSolicitud: { texto: "Aceptar solicitud", clase: "aceptar" },
  amigos: { texto: "Amigos", clase: "amigos" },
};

export default function BotonAmistad({
  estado = "conectar",
  onAccion,
  deshabilitado = false,
}) {
  const actual = ESTADOS_AMISTAD[estado] || ESTADOS_AMISTAD.conectar;

  return (
    <button
      className={`botonAmistad ${actual.clase} ${deshabilitado ? "deshabilitado" : ""}`}
      type="button"
      onClick={deshabilitado ? undefined : onAccion}
      disabled={deshabilitado}
    >
      {actual.texto}
    </button>
  );
}
