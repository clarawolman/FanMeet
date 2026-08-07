import "./ModalConfirmacion.css";

function ModalConfirmacion({
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  confirmando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    <div className="modalConfirmacionFondo">
      <div className="modalConfirmacionCaja">
        <p className="modalConfirmacionTexto">{mensaje}</p>

        <button
          className="modalConfirmacionBotonPrincipal"
          onClick={onConfirmar}
          disabled={confirmando}
        >
          {confirmando ? "Un momento..." : textoConfirmar}
        </button>

        <button className="modalConfirmacionBotonSecundario" onClick={onCancelar} disabled={confirmando}>
          {textoCancelar}
        </button>
      </div>
    </div>
  );
}

export default ModalConfirmacion;
