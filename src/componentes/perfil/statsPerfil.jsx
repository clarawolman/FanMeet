import "./statsPerfil.css";

export default function StatsPerfil({ estadisticas }) {
  return (
    <div className="statsPerfil">
      <div className="statItemPerfil">
        <p className="statValuePerfil">{estadisticas?.conciertos ?? 0}</p>
        <p className="statLabelPerfil">Conciertos</p>
      </div>

      <div className="statItemPerfil">
        <p className="statValuePerfil">{estadisticas?.amigos ?? 0}</p>
        <p className="statLabelPerfil">Amigos</p>
      </div>

      <div className="statItemPerfil">
        <p className="statValuePerfil">{estadisticas?.grupos ?? 0}</p>
        <p className="statLabelPerfil">Grupos</p>
      </div>
    </div>
  );
}
