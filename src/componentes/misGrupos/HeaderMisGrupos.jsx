import HeaderApp from "../generales/HeaderApp";
import TabsEventosGrupos from "../generales/TabsEventosGrupos";

function HeaderMisGrupos({ onVolver }) {
  return (
    <HeaderApp
      titulo="Tus grupos"
      acciones={<TabsEventosGrupos activo="grupos" onEventos={onVolver} />}
    />
  );
}

export default HeaderMisGrupos;
