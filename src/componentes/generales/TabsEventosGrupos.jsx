import "./TabsEventosGrupos.css";

// Selector "Eventos | Grupos" que comparten Tus eventos y Tus grupos, así
// las dos pantallas se ven y se usan igual.
export default function TabsEventosGrupos({ activo, onEventos, onGrupos }) {
  return (
    <div className="tabsEventosGrupos" role="tablist" aria-label="Tus eventos y grupos">
      <button
        type="button"
        role="tab"
        aria-selected={activo === "eventos"}
        className={activo === "eventos" ? "activo" : ""}
        onClick={activo === "eventos" ? undefined : onEventos}
      >
        Eventos
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activo === "grupos"}
        className={activo === "grupos" ? "activo" : ""}
        onClick={activo === "grupos" ? undefined : onGrupos}
      >
        Grupos
      </button>
    </div>
  );
}
