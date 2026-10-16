import { api } from "../api";
import { Cargando } from "../componentes";
import { useCarga } from "../utilidades";

export default function Resumen() {
  const { datos, error, cargando } = useCarga(() => api.resumen(), []);

  const tarjetas = datos
    ? [
        { titulo: "Reportes pendientes", valor: datos.reportesPendientes, href: "#reportes", destacar: datos.reportesPendientes > 0 },
        { titulo: "Usuarios", valor: datos.usuarios, href: "#usuarios" },
        { titulo: "Suspendidos", valor: datos.suspendidos, href: "#usuarios" },
        { titulo: "Conciertos", valor: datos.conciertos, href: "#conciertos" },
        { titulo: "Grupos", valor: datos.grupos, href: "#grupos" },
      ]
    : [];

  return (
    <>
      <h1>Resumen</h1>
      <Cargando error={error} cargando={cargando}>
        <div className="grillaTarjetas">
          {tarjetas.map((t) => (
            <a key={t.titulo} href={t.href} className={`tarjeta numero ${t.destacar ? "destacada" : ""}`}>
              <span>{t.titulo}</span>
              <strong>{t.valor}</strong>
            </a>
          ))}
        </div>
      </Cargando>
    </>
  );
}
