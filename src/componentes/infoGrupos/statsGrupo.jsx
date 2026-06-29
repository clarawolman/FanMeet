import "./statsGrupo.css";
export default function StatsGrupo({ grupo }) {

   return (
      <div className="statsGrupo">

         <div className="statCard">
            <span className="statIcon">📅</span>
            <p className="statLabel">Fecha</p>
            <p className="statValue">{grupo.fecha}</p>
         </div>

         <div className="statCard">
            <span className="statIcon">🕐</span>
            <p className="statLabel">Hora</p>
            <p className="statValue">{grupo.hora}</p>
         </div>

         <div className="statCard">
            <span className="statIcon">📍</span>
            <p className="statLabel">Lugar</p>
            <p className="statValue">{grupo.ubicacion}</p>
         </div>

      </div>
   );
}