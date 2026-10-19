import HeaderApp from "../generales/HeaderApp";

function HeaderCrearGrupo({ onVolver, titulo = "Crear sub-evento" }) {
  return <HeaderApp onVolver={onVolver} titulo={titulo} />;
}

export default HeaderCrearGrupo;
