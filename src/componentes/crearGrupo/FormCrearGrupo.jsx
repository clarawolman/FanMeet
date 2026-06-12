import "./FormCrearGrupo.css";

function FormCrearGrupo({
  formulario,
  setFormulario,
  crearGrupo,
  guardando,
  errorTexto,
}) {
  function actualizarCampo(campo, valor) {
    setFormulario({
      ...formulario,
      [campo]: valor,
    });
  }

  return (
    <main className="crearGrupoContenido">
      <h1 className="crearGrupoTitulo">NUEVO GRUPO</h1>

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

          {formulario.imagenPreview && (
            <img
              className="crearGrupoPreviewImagen"
              src={formulario.imagenPreview}
              alt="Vista previa del grupo"
            />
          )}
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
          Calendarizar
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

        <label className="crearGrupoLabel">
          Descripción
          <input
            className="crearGrupoInput"
            type="text"
            placeholder="Escriba algo aquí..."
            value={formulario.descripcion}
            onChange={(e) => actualizarCampo("descripcion", e.target.value)}
          />
        </label>

        <div className="crearGrupoCategoriaBloque">
          <p className="crearGrupoLabelTexto">Categoria</p>

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

        {errorTexto && <p className="crearGrupoError">{errorTexto}</p>}

        <button className="crearGrupoBoton" type="submit" disabled={guardando}>
          {guardando ? "Creando..." : "Crear grupo"}
        </button>
      </form>
    </main>
  );
}

export default FormCrearGrupo;