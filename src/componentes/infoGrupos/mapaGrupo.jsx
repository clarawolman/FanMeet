export default function MapaGrupo({ ubicacion }) {
   return (
      <div className="mapaGrupo">

         <h3>Ubicación</h3>

         <div className="mapaFake">
            {ubicacion}
         </div>

      </div>
   );
}