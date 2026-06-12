import "./DescartarCambios.css";
function DescartarCambios({ onDescartar, onCancelar }) {
  return (
    <div className="modalDescartarFondo">
      <div className="modalDescartarCaja">
        <p className="modalDescartarTexto">
          ¿Desea descartar los cambios hechos?
        </p>

        <button className="modalBotonDescartar" onClick={onDescartar}>
          Descartar
        </button>

        <button className="modalBotonCancelar" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default DescartarCambios;