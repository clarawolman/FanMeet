export default function ParticipantesGrupo({ participantes }) {

   return (
      <div className="participantesGrupo">

         <div className="imagenesParticipantes">
            {participantes.slice(0, 4).map((user) => (
               <img
                  key={user.id_usuario}
                  src={user.fotoperfil}
                  alt={user.nombre}
                  className="fotoParticipante"
               />
            ))}
         </div>

         <span>
            {participantes.length} fans confirmados
         </span>

      </div>
   );
}