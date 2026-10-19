import "./FansUnidos.css";

function FansUnidos({ fans = [], cantidadFans = 0, onConocerlos }) {
  const caras = fans.slice(0, 5);

  return (
    <button className="FansUnidosCard" type="button" onClick={onConocerlos}>
      <span className="FansEtiqueta">Quiénes van</span>

      <span className="FansFila">
        {caras.length > 0 && (
          <span className="FansCaras" aria-hidden="true">
            {caras.map((fan) => (
              <img key={fan.id_usuario} src={fan.foto_perfil} alt="" />
            ))}
          </span>
        )}
        <span className="FansCantidad">
          <strong>{cantidadFans}</strong> {cantidadFans === 1 ? "fan" : "fans"}
        </span>
      </span>

      <span className="FansTexto">
        Conocelos
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

export default FansUnidos;
