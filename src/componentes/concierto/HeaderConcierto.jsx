import "./HeaderConcierto.css";

function HeaderConcierto({ concierto, onVolver }) {
  return (
    <header className="HeaderConcierto">
      <button className="HeaderBoton" type="button" onClick={onVolver}>
        ←
      </button>

      <h1 className="HeaderTitulo">{concierto.nombre}</h1>
    </header>
  );
}

export default HeaderConcierto;