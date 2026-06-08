import "./HeaderCrearGrupo.css";
function HeaderCrearGrupo({ onVolver }) {
  return (
    <header className="crearGrupoHeader">
      <button className="crearGrupoVolver" onClick={onVolver}>
        ←
      </button>

      <p className="crearGrupoHeaderTexto">Crear sub-evento</p>
    </header>
  );
}

export default HeaderCrearGrupo;