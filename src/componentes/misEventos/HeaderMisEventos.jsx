import HeaderApp from "../generales/HeaderApp";

function HeaderMisEventos({ onIrMisGrupos }) {
  return (
    <HeaderApp
      titulo="Tus eventos"
      acciones={
        <button className="headerAppBotonAccion" type="button" onClick={onIrMisGrupos}>
          Mis grupos →
        </button>
      }
    />
  );
}

export default HeaderMisEventos;
