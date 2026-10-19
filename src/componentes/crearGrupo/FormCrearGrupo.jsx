import "../generales/TiraTicket.css";
import "./FormCrearGrupo.css";
import { formatearFechaLarga } from "../../utils/fechas";

const CATEGORIAS = [
  { id: "pre", nombre: "Previa", detalle: "Antes del show" },
  { id: "mismo_dia", nombre: "El mismo día", detalle: "Para ir juntos" },
  { id: "after", nombre: "After", detalle: "Después del show" },
];

const MAX_NOMBRE = 60;

function IconoCamara(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.3-2h5.2l1.3 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

// Mismo diseño que la pantalla del grupo: la foto con el nombre arriba y
// el talón con fecha, hora y punto de encuentro montado sobre el borde.
// Lo que se escribe se ve en vivo, tal como lo van a ver los demás fans.
function FormCrearGrupo({
  formulario,
  setFormulario,
  crearGrupo,
  guardando,
  errorTexto,
  concierto,
  imagenDefault,
}) {
  function actualizarCampo(campo, valor) {
    setFormulario({
      ...formulario,
      [campo]: valor,
    });
  }

  function elegirFoto(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setFormulario({
      ...formulario,
      imagenArchivo: archivo,
      imagenPreview: URL.createObjectURL(archivo),
    });
  }

  const categoria = CATEGORIAS.find((c) => c.id === formulario.categoria);
  const nombre = formulario.nombre.trim();

  return (
    <form className="crearGrupoForm" onSubmit={crearGrupo} noValidate>
      <section className="crearGrupoHero" aria-label="Vista previa del grupo">
        <label className="crearGrupoPortada">
          <img src={formulario.imagenPreview || imagenDefault} alt="" />

          {categoria && <span className="crearGrupoPortadaCategoria">{categoria.nombre}</span>}

          <span className="crearGrupoPortadaBoton">
            <IconoCamara />
            {formulario.imagenPreview ? "Cambiar foto" : "Elegir foto"}
          </span>

          <span className="crearGrupoPortadaTexto">
            {concierto?.nombre && <span className="crearGrupoPortadaConcierto">{concierto.nombre}</span>}
            <span className={`crearGrupoPortadaNombre ${nombre ? "" : "crearGrupoPortadaNombre--vacio"}`}>
              {nombre || "Tu grupo"}
            </span>
          </span>

          <input
            className="crearGrupoInputArchivo"
            type="file"
            accept="image/*"
            aria-label="Foto del grupo"
            onChange={elegirFoto}
          />
        </label>

        <div className="tiraTicket crearGrupoTira">
          <label className="tiraTicketCelda crearGrupoCelda">
            <span className="crearGrupoCeldaEtiqueta">Fecha</span>
            <input
              type="date"
              value={formulario.fecha}
              onChange={(e) => actualizarCampo("fecha", e.target.value)}
            />
            {formulario.fecha && <small>{formatearFechaLarga(formulario.fecha)}</small>}
          </label>

          <label className="tiraTicketCelda crearGrupoCelda">
            <span className="crearGrupoCeldaEtiqueta">Hora</span>
            <input
              type="time"
              value={formulario.hora}
              onChange={(e) => actualizarCampo("hora", e.target.value)}
            />
          </label>

          <label className="tiraTicketCelda crearGrupoCelda">
            <span className="crearGrupoCeldaEtiqueta">Punto de encuentro</span>
            <input
              type="text"
              placeholder="Ej: Plaza Serrano, Palermo"
              value={formulario.ubicacion}
              onChange={(e) => actualizarCampo("ubicacion", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="crearGrupoBloque">
        <label className="crearGrupoCampo">
          <span className="crearGrupoCampoFila">
            <span className="crearGrupoCampoEtiqueta">Nombre del grupo</span>
            <span className="crearGrupoContador">
              {formulario.nombre.length}/{MAX_NOMBRE}
            </span>
          </span>
          <input
            className="crearGrupoInput"
            type="text"
            placeholder="Ej: Previa en Palermo"
            maxLength={MAX_NOMBRE}
            value={formulario.nombre}
            onChange={(e) => actualizarCampo("nombre", e.target.value)}
          />
        </label>

        <fieldset className="crearGrupoCampo crearGrupoTipos">
          <legend className="crearGrupoCampoEtiqueta">¿Cuándo se juntan?</legend>
          <div className="crearGrupoCategorias">
            {CATEGORIAS.map((c) => (
              <label
                key={c.id}
                className={`crearGrupoCategoria ${formulario.categoria === c.id ? "activa" : ""}`}
              >
                <input
                  type="radio"
                  name="categoria"
                  value={c.id}
                  checked={formulario.categoria === c.id}
                  onChange={() => actualizarCampo("categoria", c.id)}
                />
                <strong>{c.nombre}</strong>
                <small>{c.detalle}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="crearGrupoCampo">
          <span className="crearGrupoCampoFila">
            <span className="crearGrupoCampoEtiqueta">Descripción</span>
            <span className="crearGrupoOpcional">Opcional</span>
          </span>
          <textarea
            className="crearGrupoTextarea"
            placeholder="Dónde se juntan, a qué hora, cómo llegan…"
            rows={4}
            value={formulario.descripcion}
            onChange={(e) => actualizarCampo("descripcion", e.target.value)}
          />
        </label>
      </section>

      {errorTexto && (
        <p className="fmAvisoError crearGrupoError" role="alert">
          {errorTexto}
        </p>
      )}

      <div className="crearGrupoBarra">
        <span className="crearGrupoBarraTexto">
          <strong>{nombre || "Nuevo grupo"}</strong>
          <small>Los fans del show lo van a ver así.</small>
        </span>
        <button className="fmBotonPrimario" type="submit" disabled={guardando}>
          {guardando ? "Creando…" : "Crear grupo"}
        </button>
      </div>
    </form>
  );
}

export default FormCrearGrupo;
