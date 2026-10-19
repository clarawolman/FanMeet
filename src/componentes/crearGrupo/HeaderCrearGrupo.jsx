import HeaderApp from "../generales/HeaderApp";

function HeaderCrearGrupo({ onVolver, titulo = "Nuevo grupo" }) {
  return <HeaderApp onVolver={onVolver} titulo={titulo} />;
}

export default HeaderCrearGrupo;
