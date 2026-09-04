import "./participantesGrupo.css";
export default function ParticipantesGrupo({ participantes, onVerFansConfirmados }) {

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
            {participantes.length} fans confirmados
         </span>

      </button>
   );
}