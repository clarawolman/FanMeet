import "../generales/TiraTicket.css";
import "./FormCrearGrupo.css";
import { formatearFechaLarga, partesFecha } from "../../utils/fechas";

const CATEGORIAS = [
  { id: "pre", nombre: "Previa", detalle: "Antes del show" },
  { id: "mismo_dia", nombre: "El mismo día", detalle: "Para ir juntos" },
  { id: "after", nombre: "After", detalle: "Después del show" },
];

// Solo para grupos de todas las fechas: sin encuentro, para charlar.
const COMUNIDAD = { id: "comunidad", nombre: "Comunidad", detalle: "Sin encuentro, para charlar" };

// [13 nov, 14 nov, 15 nov] -> "13, 14 y 15 de nov"
function textoFechas(fechas) {
  const partes = fechas.map((c) => partesFecha(c?.fecha)).filter(Boolean);
  if (partes.length === 0) return "";
  const enLista = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`);
  if (partes.every((p) => p.mes === partes[0].mes)) return `${enLista(partes.map((p) => p.dia))} de ${partes[0].mes}`;
  return enLista(partes.map((p) => `${p.dia} ${p.mes}`));
}

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
  editando = false,
  fechasSeguidas = [],
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

  // Comunidad se ofrece si el grupo es de todas las fechas (o ya lo era).
  const categorias =
    formulario.todasLasFechas || formulario.categoria === COMUNIDAD.id ? [...CATEGORIAS, COMUNIDAD] : CATEGORIAS;
  const categoria = categorias.find((c) => c.id === formulario.categoria);
  const sinEncuentro = formulario.categoria === COMUNIDAD.id;
  const nombre = formulario.nombre.trim();

  function elegirFechas(todas) {
    setFormulario({
      ...formulario,
      todasLasFechas: todas,
      // Una sola fecha no puede ser comunidad: vuelve a Previa.
      categoria: !todas && formulario.categoria === COMUNIDAD.id ? "pre" : formulario.categoria,
    });
  }

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

        {sinEncuentro ? (
          <div className="tiraTicket crearGrupoTira">
            <p className="tiraTicketCelda crearGrupoCelda crearGrupoSinEncuentro">
              <span className="crearGrupoCeldaEtiqueta">Sin encuentro</span>
              Un grupo para charlar entre los que van{formulario.todasLasFechas ? " a cualquiera de las fechas" : ""}.
            </p>
          </div>
        ) : (
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
        )}
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

        {fechasSeguidas.length > 1 && (
          <fieldset className="crearGrupoCampo crearGrupoTipos">
            <legend className="crearGrupoCampoEtiqueta">¿Para qué fechas?</legend>
            <div className="crearGrupoCategorias">
              {[
                { todas: false, nombre: "Solo esta", detalle: textoFechas([concierto]) },
                { todas: true, nombre: "Todas las fechas", detalle: textoFechas(fechasSeguidas) },
              ].map((opcion) => (
                <label
                  key={opcion.nombre}
                  className={`crearGrupoCategoria ${formulario.todasLasFechas === opcion.todas ? "activa" : ""}`}
                >
                  <input
                    type="radio"
                    name="fechas"
                    checked={formulario.todasLasFechas === opcion.todas}
                    onChange={() => elegirFechas(opcion.todas)}
                  />
                  <strong>{opcion.nombre}</strong>
                  <small>{opcion.detalle}</small>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="crearGrupoCampo crearGrupoTipos">
          <legend className="crearGrupoCampoEtiqueta">¿Cuándo se juntan?</legend>
          <div className="crearGrupoCategorias">
            {categorias.map((c) => (
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

        <fieldset className="crearGrupoCampo crearGrupoTipos">
          <legend className="crearGrupoCampoEtiqueta">Cupo</legend>
          <div className="crearGrupoCategorias">
            {[
              { limitado: false, nombre: "Sin límite", detalle: "Se suma quien quiera" },
              { limitado: true, nombre: "Limitado", detalle: "Hasta cierta cantidad" },
            ].map((opcion) => (
              <label
                key={opcion.nombre}
                className={`crearGrupoCategoria ${formulario.limitado === opcion.limitado ? "activa" : ""}`}
              >
                <input
                  type="radio"
                  name="limitado"
                  checked={formulario.limitado === opcion.limitado}
                  onChange={() => actualizarCampo("limitado", opcion.limitado)}
                />
                <strong>{opcion.nombre}</strong>
                <small>{opcion.detalle}</small>
              </label>
            ))}
          </div>
          {formulario.limitado && (
            <label className="crearGrupoCupo">
              <span className="crearGrupoCampoEtiqueta">¿Cuántas personas en total? (vos incluido/a)</span>
              <input
                className="crearGrupoInput"
                type="number"
                inputMode="numeric"
                min={2}
                max={500}
                placeholder="Ej: 8"
                value={formulario.cupo}
                onChange={(e) => actualizarCampo("cupo", e.target.value)}
              />
            </label>
          )}
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
          <strong>{nombre || (editando ? "Editar grupo" : "Nuevo grupo")}</strong>
          <small>
            {formulario.todasLasFechas
              ? "Lo van a ver los fans de todas las fechas."
              : "Los fans del show lo van a ver así."}
          </small>
        </span>
        <button className="fmBotonPrimario" type="submit" disabled={guardando}>
          {guardando
            ? editando ? "Guardando…" : "Creando…"
            : editando ? "Guardar cambios" : "Crear grupo"}
        </button>
      </div>
    </form>
  );
}

export default FormCrearGrupo;
