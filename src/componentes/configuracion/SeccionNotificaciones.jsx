import { Grupo, Interruptor } from "./piezas";

const INTERRUPTORES = [
  { clave: "amistad", titulo: "Amistades", descripcion: "Solicitudes nuevas y cuando aceptan la tuya." },
  { clave: "mensajes", titulo: "Mensajes", descripcion: "Chats privados y de tus grupos." },
  { clave: "momentos", titulo: "Momentos", descripcion: "Me gusta y comentarios en tus momentos." },
  { clave: "grupos", titulo: "Grupos", descripcion: "Gente que se suma y cambios en tus grupos." },
  {
    clave: "conciertos",
    titulo: "Conciertos",
    descripcion: "Novedades de tus conciertos y shows nuevos de tus artistas favoritos.",
  },
];

const RECORDATORIOS = [
  { dias: 7, texto: "Una semana antes" },
  { dias: 1, texto: "Un día antes" },
  { dias: 0, texto: "El día del show" },
];

export default function SeccionNotificaciones({ preferencias, onGuardarPreferencias }) {
  const dias = preferencias.recordatorio_dias || [];

  function alternarDia(dia) {
    const nuevos = dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia];
    onGuardarPreferencias({ recordatorio_dias: nuevos });
  }

  return (
    <>
      <Grupo
        titulo="Qué te avisamos"
        descripcion="Las invitaciones a momentos te llegan siempre: sin ellas no podrías aceptarlas."
      >
        {INTERRUPTORES.map(({ clave, titulo, descripcion }) => (
          <Interruptor
            key={clave}
            titulo={titulo}
            descripcion={descripcion}
            activo={preferencias.notificaciones[clave]}
            onCambiar={(v) => onGuardarPreferencias({ notificaciones: { [clave]: v } })}
          />
        ))}
      </Grupo>

      <Grupo
        titulo="Recordatorios de conciertos"
        descripcion="De los conciertos a los que te uniste. Podés elegir más de uno, o ninguno."
      >
        <div className="configChecks">
          {RECORDATORIOS.map(({ dias: dia, texto }) => (
            <label key={dia} className="configCheck">
              <input type="checkbox" checked={dias.includes(dia)} onChange={() => alternarDia(dia)} />
              {texto}
            </label>
          ))}
        </div>
      </Grupo>
    </>
  );
}
