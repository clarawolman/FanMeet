export default function HeroGrupo({ grupo }) {
   return (
      <div className="heroGrupo">

         <div className="heroImageContainer">

            <img src={grupo.foto} />

            <span>
               Evento Gratuito
            </span>

         </div>

         <h1>
            {grupo.nombre}
            <span>
               {grupo.concierto.nombre}
            </span>
         </h1>

      </div>
   );
}