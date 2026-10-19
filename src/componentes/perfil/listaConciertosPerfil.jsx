import "../generales/TarjetaLista.css";
import "./listaAmigosPerfil.css";
import HeaderApp from "../generales/HeaderApp";
import CardEvento from "../misEventos/CardEvento";
import { separarProximosYPasados } from "../../utils/fechas";

function SeccionConciertos({ titulo, eventos }) {
  if (eventos.length === 0) return null;

  return (
    <section className="listaSeccion">
      <div className="listaSeccionHeader">
        <h2>{titulo}</h2>
        <span className="listaSeccionCantidad">{eventos.length}</span>
      </div>

      <ul className="listaTarjetas">
        {eventos.map((evento) => (
          <li key={evento.id_concierto}>
            <CardEvento evento={evento} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Archivo de conciertos de otra persona (se abre desde "Conciertos" en su
// perfil). Sin "Ingresar": solo pueden entrar a un concierto los unidos.
export default function ListaConciertosPerfil({ usuario, eventos, onVolver }) {
  const { proximos, pasados } = separarProximosYPasados(eventos);

  return (
    <div className="listaAmigosPerfil">
      <HeaderApp
        onVolver={onVolver}
        titulo={`Conciertos de ${usuario?.nombre || "este usuario"}`}
        subtitulo={`${eventos.length} ${eventos.length === 1 ? "concierto" : "conciertos"}`}
      />

      <main className="listaLayout">
        {eventos.length === 0 && (
          <div className="listaMensaje">
            <p>Todavía no se unió a ningún concierto.</p>
          </div>
        )}

        <SeccionConciertos titulo="Próximos" eventos={proximos} />
        <SeccionConciertos titulo="Historial de conciertos" eventos={pasados} />
      </main>
    </div>
  );
}
