import "./HeaderMisGrupos.css";

function HeaderMisGrupos({ onVolver }) {
  return (
    <>
      <header className="headerMisGrupos">
        <button className="btnVolver" onClick={onVolver}>
          ←
        </button>

        <h2>Tus grupos</h2>
      </header>
    </>
  );
}

export default HeaderMisGrupos;