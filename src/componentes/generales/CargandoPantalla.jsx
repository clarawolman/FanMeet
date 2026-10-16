import LoadingSpinner from "./LoadingSpinner";

function CargandoPantalla({ texto = "Cargando..." }) {
  return <LoadingSpinner texto={texto} pantallaCompleta />;
}

export default CargandoPantalla;
