import { useEffect, useState } from "react";
import "./listaAmigosPerfil.css";
import { supabase } from "../../supabase";

export default function ListaAmigosPerfil({ usuario, onVolver, onVerUsuario }) {
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargarAmigos() {
    setCargando(true);

    const { data: relaciones, error: errorRelaciones } = await supabase
      .from("amistad")
      .select("*")
      .eq("estado", "aceptada")
      .or(`id_solicitante.eq.${usuario.id_usuario},id_receptor.eq.${usuario.id_usuario}`);

    if (errorRelaciones) {
      console.error("Error cargando amigos:", errorRelaciones);
      setAmigos([]);
      setCargando(false);
      return;
    }

    const idsAmigos = (relaciones || []).map((relacion) =>
      relacion.id_solicitante === usuario.id_usuario
        ? relacion.id_receptor
        : relacion.id_solicitante
    );

    if (idsAmigos.length === 0) {
      setAmigos([]);
      setCargando(false);
      return;
    }

    const { data: usuarios, error: errorUsuarios } = await supabase
      .from("usuario")
      .select("*")
      .in("id_usuario", idsAmigos);

    if (errorUsuarios) {
      console.error("Error cargando datos de amigos:", errorUsuarios);
      setAmigos([]);
      setCargando(false);
      return;
    }

    setAmigos(usuarios || []);
    setCargando(false);
  }

  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarAmigos();
    }
  }, [usuario?.id_usuario]);

  return (
    <div className="listaAmigosPerfil">
      <header className="listaAmigosPerfilHeader">
        <button
          className="listaAmigosPerfilVolver"
          type="button"
          onClick={onVolver}
          aria-label="Volver"
        >
          ←
        </button>

        <div>
          <h1>Amigos</h1>
          <p>{amigos.length} {amigos.length === 1 ? "amigo" : "amigos"}</p>
        </div>
      </header>

      <main className="listaAmigosPerfilMain">
        {cargando && <p className="listaAmigosPerfilVacio">Cargando amigos...</p>}

        {!cargando && amigos.length === 0 && (
          <p className="listaAmigosPerfilVacio">Todavía no tiene amigos agregados.</p>
        )}

        {!cargando &&
          amigos.map((amigo) => (
            <button
              key={amigo.id_usuario}
              className="amigoPerfilCard"
              type="button"
              onClick={() => onVerUsuario(amigo.id_usuario)}
            >
              <img
                className="amigoPerfilFoto"
                src={amigo.fotoperfil || amigo.foto_perfil}
                alt={amigo.nombre}
              />
              <span className="amigoPerfilNombre">{amigo.nombre}</span>
            </button>
          ))}
      </main>
    </div>
  );
}
