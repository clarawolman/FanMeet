import LoadingSpinner from "./LoadingSpinner";

function CargandoPantalla({ texto = "Cargando..." }) {
  return <LoadingSpinner texto={texto} pantallaCompleta tamano={44} />;
}

export default CargandoPantalla;
