import "./PaginaNoEncontrada.css";
import Marca from "./Marca";

// Páginas de error con forma de entrada "no válida":
// - noEncontrada (404): URL que no existe, o un concierto / grupo / perfil
//   que ya no está.
// - sinAcceso (403): el concierto (o el grupo) existe, pero la persona no
//   se unió al concierto con el código de acceso.
const CONTENIDO = {
  noEncontrada: {
    codigo: "404",
    sello: "No válida",
    datos: ["—", "—", "—"],
    titulo: () => "Este show no está en la grilla",
    texto: () => "La página que buscás no existe o se movió.",
  },
  sinAcceso: {
    codigo: "403",
    sello: "Sin acceso",
    datos: ["Cerrada", "—", "—"],
    titulo: (recurso) =>
      recurso === "grupo" ? "Este grupo es solo para los unidos" : "Este concierto es solo para los unidos",
    texto: (recurso) =>
      recurso === "grupo"
        ? "El grupo es de un concierto al que todavía no te uniste. Buscá el concierto en el inicio y entrá con el código de acceso."
        : "Clave de acceso requerida para este concierto. Buscalo en el inicio y tocá “Unirme”.",
  },
};

export default function PaginaNoEncontrada({ tipo = "noEncontrada", recurso, conSesion, onIrAlInicio }) {
  const contenido = CONTENIDO[tipo] || CONTENIDO.noEncontrada;
  const puedeVolver = window.history.length > 1;
  const textoInicio = !conSesion
    ? "Ir a iniciar sesión"
    : tipo === "sinAcceso"
      ? "Buscar el concierto"
      : "Volver al inicio";

  return (
    <main className="pagina404">
      <div className="pagina404Contenido">
        <Marca className="pagina404Marca" />

        <div className={`pagina404Ticket pagina404Ticket--${tipo}`} aria-hidden="true">
          <div className="pagina404TicketCuerpo">
            <span className="pagina404Etiqueta">Entrada general</span>
            <strong className="pagina404Numero">{contenido.codigo}</strong>
            <dl className="pagina404Datos">
              {["Puerta", "Fila", "Asiento"].map((nombre, i) => (
                <div key={nombre}>
                  <dt>{nombre}</dt>
                  <dd>{contenido.datos[i]}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="pagina404TicketTalon">
            <span className="pagina404Sello">{contenido.sello}</span>
          </div>
        </div>

        <h1 className="pagina404Titulo">{contenido.titulo(recurso)}</h1>
        <p className="pagina404Texto">{contenido.texto(recurso)}</p>

        <div className="pagina404Acciones">
          <button className="fmBotonPrimario" type="button" onClick={onIrAlInicio}>
            {textoInicio}
          </button>

          {puedeVolver && (
            <button
              className="pagina404Secundario"
              type="button"
              onClick={() => window.history.back()}
            >
              Volver atrás
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
