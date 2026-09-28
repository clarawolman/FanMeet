import HeaderApp from "../generales/HeaderApp";

function HeaderConcierto({ concierto, onVolver }) {
  return <HeaderApp onVolver={onVolver} titulo={concierto.nombre} />;
}

export default HeaderConcierto;
