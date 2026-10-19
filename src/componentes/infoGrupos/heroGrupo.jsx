import "./heroGrupo.css";

// Misma foto por defecto que CardGrupo (misGrupos) y SubEventos.
const FOTO_GRUPO_DEFAULT = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80";

export default function HeroGrupo({ grupo, concierto }) {
   // Los grupos creados desde el backoffice pueden no tener foto: se usa la
   // del concierto (src="" hace que el navegador vuelva a pedir la página).
   const foto = grupo.foto || concierto?.imagen || FOTO_GRUPO_DEFAULT;

   return (
      <div className="heroGrupo">

         <div className="heroImageContainer">

            <img
               src={foto}
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