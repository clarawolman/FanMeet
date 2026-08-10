import "./statsPerfil.css";

export default function StatsPerfil({ estadisticas, onVerAmigos }) {
  return (
    <div className="statsPerfil">
      <button className="statItemPerfil" type="button"> 
        <p className="statValuePerfil">{estadisticas?.conciertos ?? 0}</p>
        <p className="statLabelPerfil">Conciertos</p>
      </button>

      <button className="statItemPerfil" type="button" onClick={onVerAmigos}>
        <p className="statValuePerfil">{estadisticas?.amigos ?? 0}</p>
        <p className="statLabelPerfil">Amigos</p>
      </button>

      <button className="statItemPerfil" type="button">
        <p className="statValuePerfil">{estadisticas?.grupos ?? 0}</p>
        <p className="statLabelPerfil">Grupos</p>
      </button>
    </div>
  );
}
