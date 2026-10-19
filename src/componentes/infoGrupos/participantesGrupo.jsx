import "./participantesGrupo.css";
// "3 fans confirmados · quedan 5 lugares" (o "· Completo"). Sin cupo, solo
// la cantidad.
function textoLugares(cantidad, cupo) {
   if (!cupo) return "";
   const quedan = cupo - cantidad;
   if (quedan <= 0) return " · Completo";
   return ` · ${quedan === 1 ? "queda 1 lugar" : `quedan ${quedan} lugares`}`;
}

export default function ParticipantesGrupo({ participantes, cupo, onVerFansConfirmados }) {

   return (
      <button
         className="participantesGrupo"
         type="button"
         onClick={onVerFansConfirmados}
      >

         <div className="imagenesParticipantes">
            {participantes.slice(0, 4).map((user) => (
               <img
                  key={user.id_usuario}
                  src={user.foto_perfil}
                  alt={user.nombre}
                  className="fotoParticipante"
               />
            ))}
         </div>

         <span>
            {participantes.length} fans confirmados{textoLugares(participantes.length, cupo)}
         </span>

      </button>
   );
}