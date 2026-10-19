import "./TiraTicket.css";

// Los datos clave (fecha, hora, lugar) como el talón de una entrada:
// celdas separadas por un troquelado, con muescas a los costados.
// datos: [{ etiqueta, valor, detalle? }]
export default function TiraTicket({ datos, className = "" }) {
  const visibles = datos.filter((d) => d.valor);
  if (visibles.length === 0) return null;

  return (
    <dl className={`tiraTicket ${className}`}>
      {visibles.map((dato) => (
        <div className="tiraTicketCelda" key={dato.etiqueta}>
          <dt>{dato.etiqueta}</dt>
          <dd>
            {dato.valor}
            {dato.detalle && <small>{dato.detalle}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
