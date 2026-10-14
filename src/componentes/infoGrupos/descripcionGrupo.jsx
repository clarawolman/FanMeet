import "./descripcionGrupo.css";
export default function DescripcionGrupo({ descripcion }) {

   return (
      <div className="descripcionGrupo">

         <h3>Sobre el evento</h3>

         <p>{descripcion}</p>

      </div>
   );
}