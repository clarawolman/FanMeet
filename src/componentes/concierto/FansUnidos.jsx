import "./FansUnidos.css";

function FansUnidos({ cantidadFans = 0, onConocerlos }) {
  return (
    <section className="FansUnidosCard">
      <p className="FansCantidad">
        <strong>{cantidadFans}</strong> {cantidadFans === 1 ? "fan unido" : "fans unidos"}
      </p>
      <button className="FansTexto" type="button" onClick={onConocerlos}>
        Ver quiénes van
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </section>
  );
}

export default FansUnidos;
