export default function StatsGrupo({ grupo }) {

   return (
      <div className="statsGrupo">

         <div className="statCard">
            <p>{grupo.fecha}</p>
         </div>

         <div className="statCard">
            <p>{grupo.hora}</p>
         </div>

         <div className="statCard">
            <p>{grupo.ubicacion}</p>
         </div>

      </div>
   );
}