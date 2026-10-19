import "./FondoAmbiente.css";

// Luz de fondo con la foto del concierto o del grupo, muy desenfocada,
// arriba de la pantalla: le da el color del show sin competir con el
// contenido. Se funde con el fondo en claro y en oscuro.
export default function FondoAmbiente({ imagen }) {
  if (!imagen) return null;
  return (
    <div className="fondoAmbiente" aria-hidden="true">
      <div className="fondoAmbienteFoto" style={{ backgroundImage: `url("${imagen}")` }} />
    </div>
  );
}
