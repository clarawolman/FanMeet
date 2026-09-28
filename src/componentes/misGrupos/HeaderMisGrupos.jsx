import HeaderApp from "../generales/HeaderApp";

function HeaderMisGrupos({ onVolver }) {
  return (
    <HeaderApp
      titulo="Tus grupos"
      acciones={
        <button className="headerAppBotonAccion" type="button" onClick={onVolver}>
          ← Mis eventos
        </button>
      }
    />
  );
}

export default HeaderMisGrupos;
