import { useEffect, useState } from "react";
import "./listaAmigosPerfil.css";
import { amistadService } from "../../services/amistadService";
import LoadingSpinner from "../generales/LoadingSpinner";
import HeaderApp from "../generales/HeaderApp";

export default function ListaAmigosPerfil({ usuario, onVolver, onVerUsuario }) {
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargarAmigos() {
    setCargando(true);

    try {
      const datos = await amistadService.listarAmigos(usuario.id_usuario);
      setAmigos(datos || []);
    } catch (error) {
      console.error("Error cargando amigos:", error);
      setAmigos([]);
    }

    setCargando(false);
  }

  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarAmigos();
    }
  }, [usuario?.id_usuario]);

  return (
    <div className="listaAmigosPerfil">
      <HeaderApp
        onVolver={onVolver}
        titulo="Amigos"
        subtitulo={`${amigos.length} ${amigos.length === 1 ? "amigo" : "amigos"}`}
      />

      <main className="listaAmigosPerfilMain">
        {cargando && <LoadingSpinner texto="Cargando amigos..." />}

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
