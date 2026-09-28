import "./generosPerfil.css";

export default function GenerosPerfil({ generos, isOwnProfile, onEditar }) {
  const hayGeneros = generos.length > 0;

  return (
    <section className="generosPerfil">
      <div className="generosPerfilHeader">
        <h3>Mi música</h3>

        {isOwnProfile && (
          <button
            className="generosPerfilEditar"
            type="button"
            onClick={onEditar}
          >
            {hayGeneros ? "Editar" : "Elegir géneros"}
          </button>
        )}
      </div>

      {hayGeneros ? (
        <div className="generosPerfilTags">
          {generos.map((genero) => (
            <span className="generoTagPerfil" key={genero.id}>
              {genero.nombre}
            </span>
          ))}
        </div>
      ) : (
        <p className="generosPerfilVacio">
          {isOwnProfile
            ? "Todavía no elegiste tus géneros favoritos."
            : "Todavía no eligió géneros favoritos."}
        </p>
      )}
    </section>
  );
}
