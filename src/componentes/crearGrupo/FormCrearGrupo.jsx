import "./FormCrearGrupo.css";

function FormCrearGrupo({
  formulario,
  setFormulario,
  crearGrupo,
  guardando,
  errorTexto,
  editando = false,
}) {
  function actualizarCampo(campo, valor) {
    setFormulario({
      ...formulario,
      [campo]: valor,
    });
  }

  return (
    <main className="crearGrupoContenido">
      <h1 className="crearGrupoTitulo">{editando ? "Editar grupo" : "Nuevo grupo"}</h1>

      <form className="crearGrupoForm" onSubmit={crearGrupo}>
        <label className="crearGrupoLabel">
          Nombre del sub-evento
          <input
            className="crearGrupoInput"
            type="text"
            placeholder="Ej: Previa en Palermo"
            value={formulario.nombre}
            onChange={(e) => actualizarCampo("nombre", e.target.value)}
          />
        </label>
        <label className="crearGrupoLabel">
          Foto del grupo
          <span className="crearGrupoFotoPicker">
            <span className="crearGrupoFotoCirculo">
              {formulario.imagenPreview ? (
                <img
                  className="crearGrupoPreviewImagen"
                  src={formulario.imagenPreview}
                  alt="Vista previa del grupo"
                />
              ) : (
                <span className="crearGrupoFotoIcono" aria-hidden="true">
                  ▣
                </span>
              )}
            </span>
            <span className="crearGrupoFotoTexto">
              {formulario.imagenPreview ? "Cambiar foto" : "Elegir foto"}
            </span>
            <input
              className="crearGrupoInputArchivo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const archivo = e.target.files[0];

                if (!archivo) return;

                setFormulario({
                  ...formulario,
                  imagenArchivo: archivo,
                  imagenPreview: URL.createObjectURL(archivo),
                });
              }}
            />
          </span>
        </label>

        <label className="crearGrupoLabel">
          Ubicación
          <input
            className="crearGrupoInput"
            type="text"
            placeholder="Ej: Movistar Arena, Humboldt 450, CABA"
            value={formulario.ubicacion}
            onChange={(e) => actualizarCampo("ubicacion", e.target.value)}
          />
        </label>

        <label className="crearGrupoLabel">
          Fecha
          <input
            className="crearGrupoInput"
            type="date"
            value={formulario.fecha}
            onChange={(e) => actualizarCampo("fecha", e.target.value)}
          />
        </label>
        <label className="crearGrupoLabel">
          Hora
          <input
            className="crearGrupoInput"
            type="time"
            value={formulario.hora}
            onChange={(e) => actualizarCampo("hora", e.target.value)}
          />
        </label>

        <label className="crearGrupoLabel crearGrupoLabelDescripcion">
          Descripción
          <textarea
            className="crearGrupoTextarea"
            placeholder="Dónde se juntan, a qué hora, cómo llegan…"
            rows={4}
            value={formulario.descripcion}
            onChange={(e) => actualizarCampo("descripcion", e.target.value)}
          />
        </label>

        <div className="crearGrupoCategoriaBloque">
          <p className="crearGrupoLabelTexto">Categoría</p>

          <div className="crearGrupoCategorias">
            <button
              type="button"
              className={
                formulario.categoria === "pre"
                  ? "crearGrupoCategoria activa"
                  : "crearGrupoCategoria"
              }
              onClick={() => actualizarCampo("categoria", "pre")}
            >
              Pre
            </button>

            <button
              type="button"
              className={
                formulario.categoria === "after"
                  ? "crearGrupoCategoria activa"
                  : "crearGrupoCategoria"
              }
              onClick={() => actualizarCampo("categoria", "after")}
            >
              After
            </button>

            <button
              type="button"
              className={
                formulario.categoria === "mismo_dia"
                  ? "crearGrupoCategoria activa"
                  : "crearGrupoCategoria"
              }
              onClick={() => actualizarCampo("categoria", "mismo_dia")}
            >
              Durante
            </button>
          </div>
        </div>

        <div className="crearGrupoCategoriaBloque">
          <p className="crearGrupoLabelTexto">Cupo</p>

          <div className="crearGrupoCategorias">
            <button
              type="button"
              className={!formulario.limitado ? "crearGrupoCategoria activa" : "crearGrupoCategoria"}
              onClick={() => actualizarCampo("limitado", false)}
            >
              Sin límite
            </button>

            <button
              type="button"
              className={formulario.limitado ? "crearGrupoCategoria activa" : "crearGrupoCategoria"}
              onClick={() => actualizarCampo("limitado", true)}
            >
              Limitado
            </button>
          </div>

          {formulario.limitado && (
            <label className="crearGrupoLabel crearGrupoCupo">
              ¿Cuántas personas en total? (vos incluido/a)
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
        </div>

        {errorTexto && <p className="crearGrupoError">{errorTexto}</p>}

        <button className="crearGrupoBoton" type="submit" disabled={guardando}>
          {guardando
            ? editando ? "Guardando…" : "Creando…"
            : editando ? "Guardar cambios" : "Crear grupo"}
        </button>
      </form>
    </main>
  );
}

export default FormCrearGrupo;