export default function ParticipantesGrupo({ participantes }) {
   return (
      <div className="participantesGrupo">

         {participantes.slice(0, 4).map((user) => (
            <img
               key={user.id_usuario}
               src={user.fotoperfil}
            />
         ))}

         <span>
            +12k fans confirmados
         </span>

      </div>
   );
}