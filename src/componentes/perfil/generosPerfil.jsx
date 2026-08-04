import "./generosPerfil.css";

export default function GenerosPerfil({ generos, isOwnProfile, onEditar }) {
  return (
    <section className="generosPerfil">
      <div className="generosPerfilHeader">
        <h3>Géneros favoritos</h3>
        <span className="generosPerfilBadge">{generos.length} seleccionados</span>
      </div>

      {generos.length === 0 && !isOwnProfile ? (
        <p className="generosPerfilVacio">Todavía no eligió géneros favoritos.</p>
      ) : (
        <div className="generosPerfilScroll">
          {isOwnProfile && (
            <button
              className="generoChipAdd"
              type="button"
              onClick={onEditar}
              aria-label="Editar géneros favoritos"
            >
              +
            </button>
          )}

          {generos.map((genero) => (
            <div className="generoChipPerfil" key={genero.id}>
              <small>{genero.nombre}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
