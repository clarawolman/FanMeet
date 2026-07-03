import "./statsGrupo.css";
export default function StatsGrupo({ grupo }) {

   return (
      <div className="statsGrupo">

         <div className="statCard">
            <p className="statLabel">Fecha</p>
            <p className="statValue">{grupo.fecha}</p>
         </div>

         <div className="statCard">
            <p className="statLabel">Hora</p>
            <p className="statValue">{grupo.hora?.slice(0, 5)}</p>
         </div>

         <div className="statCard">
            <p className="statLabel">Lugar</p>
            <p className="statValue">{grupo.ubicacion}</p>
         </div>

      </div>
   );
}