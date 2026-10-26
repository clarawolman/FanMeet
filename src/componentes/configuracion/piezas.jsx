import { useId } from "react";

// Piezas de las secciones de Configuración.

// Título chico arriba y una tarjeta con las filas relacionadas
export function Grupo({ titulo, descripcion, children, peligro = false }) {
  return (
    <section className={`configGrupo ${peligro ? "configGrupo--peligro" : ""}`}>
      {titulo && <h3 className="configGrupoTitulo">{titulo}</h3>}
      <div className="configGrupoFilas">{children}</div>
      {descripcion && <p className="configGrupoDescripcion">{descripcion}</p>}
    </section>
  );
}

// Fila con texto a la izquierda y algo a la derecha (o abajo, si es ancho)
export function Fila({ titulo, descripcion, children, apilada = false }) {
  return (
    <div className={`configFila ${apilada ? "configFila--apilada" : ""}`}>
      <div className="configFilaTexto">
        <strong>{titulo}</strong>
        {descripcion && <span>{descripcion}</span>}
      </div>
      {children}
    </div>
  );
}

// Interruptor encendido/apagado con su fila
export function Interruptor({ titulo, descripcion, activo, onCambiar, deshabilitado = false }) {
  return (
    <Fila titulo={titulo} descripcion={descripcion}>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={titulo}
        className={`configSwitch ${activo ? "on" : ""}`}
        onClick={() => onCambiar(!activo)}
        disabled={deshabilitado}
      >
        <span className="configSwitchPerilla" />
      </button>
    </Fila>
  );
}

// Una opción entre varias (botones segmentados)
export function Opciones({ titulo, descripcion, opciones, valor, onCambiar }) {
  return (
    <Fila titulo={titulo} descripcion={descripcion} apilada>
      <div className="configOpciones" role="radiogroup" aria-label={titulo}>
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={valor === opcion.valor}
            className={valor === opcion.valor ? "activa" : ""}
            onClick={() => onCambiar(opcion.valor)}
          >
            {opcion.texto}
          </button>
        ))}
      </div>
    </Fila>
  );
}

// Fila que lleva a otro lado o abre algo
export function FilaBoton({ titulo, descripcion, texto, onClick, peligro = false }) {
  return (
    <Fila titulo={titulo} descripcion={descripcion}>
      <button
        type="button"
        className={`configBoton ${peligro ? "configBoton--peligro" : ""}`}
        onClick={onClick}
      >
        {texto}
      </button>
    </Fila>
  );
}

// Campo de texto con su etiqueta
export function Campo({ etiqueta, ayuda, ...props }) {
  const id = useId();
  return (
    <label className="configCampo" htmlFor={id}>
      <span className="configCampoEtiqueta">{etiqueta}</span>
      <input id={id} className="configInput" {...props} />
      {ayuda && <span className="configCampoAyuda">{ayuda}</span>}
    </label>
  );
}
