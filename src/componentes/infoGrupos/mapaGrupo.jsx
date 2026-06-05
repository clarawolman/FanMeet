import "./mapaGrupo.css";

export default function MapaGrupo({ ubicacion }) {
   const mapaUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
      ubicacion
   )}&z=15&output=embed`;

   return (
      <div className="mapaGrupo">
         <h3>Ubicación</h3>

         <div className="mapaFake">
            <iframe
               src={mapaUrl}
               width="100%"
               height="250"
               style={{ border: 0 }}
               loading="lazy"
               allowFullScreen
               title="Mapa"
            />
         </div>
      </div>
   );
}