import "./descripcionGrupo.css";
export default function DescripcionGrupo({ descripcion }) {
   // Sin descripción no se muestra una caja vacía.
   if (!descripcion?.trim()) return null;

   return (
      <div className="descripcionGrupo">

         <h3>Sobre el evento</h3>

         <p>{descripcion}</p>

      </div>
   );
}