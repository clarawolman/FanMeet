import HeaderApp from "../generales/HeaderApp";
import TabsEventosGrupos from "../generales/TabsEventosGrupos";

function HeaderMisEventos({ onIrMisGrupos }) {
  return (
    <HeaderApp
      titulo="Tus eventos"
      acciones={<TabsEventosGrupos activo="eventos" onGrupos={onIrMisGrupos} />}
    />
  );
}

export default HeaderMisEventos;
