import HeaderApp from "../generales/HeaderApp";

export default function HeaderGrupo({ titulo, onVolver }) {
  return <HeaderApp onVolver={onVolver} titulo={titulo} />;
}
