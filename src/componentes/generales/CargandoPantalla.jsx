import "./CargandoPantalla.css";

function CargandoPantalla({ texto = "Cargando..." }) {
  return (
    <div className="cargandoPantalla">
      <span className="cargandoSpinner" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  );
}

export default CargandoPantalla;
