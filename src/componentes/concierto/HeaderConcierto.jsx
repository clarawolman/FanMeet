import "./HeaderConcierto.css";

function HeaderConcierto({concierto}) {
  return (
    <header className="HeaderConcierto">
      <button className="HeaderBoton"> ← </button>
      <h1 className="HeaderTitulo"> {concierto.nombre} </h1>
    </header>
  );
}

export default HeaderConcierto;