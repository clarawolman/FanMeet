import "./heroGrupo.css";
export default function HeroGrupo({ grupo }) {

   return (
      <div className="heroGrupo">

         <div className="heroImageContainer">

            <img
               src={grupo.foto}
               alt={grupo.nombre}
            />

         </div>

         <h1>
            {grupo.nombre}

            <span>
               {grupo.concierto?.nombre}
            </span>
         </h1>

      </div>
   );
}