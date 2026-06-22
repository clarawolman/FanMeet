import { useEffect, useState } from "react";
import "./MisEventos.css";

import { supabase } from "../../supabase";

import HeaderMisEventos from "./HeaderMisEventos";
import CardEvento from "./CardEvento";
import Footer from "../concierto/Footer";

function MisEventos({
  usuarioActual,
  onIngresar,
  onIrMisGrupos,
}) {
  const [misEventos, setMisEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");

  useEffect(() => {
    if (usuarioActual) {
      cargarMisEventos();
    }
  }, [usuarioActual]);

  async function cargarMisEventos() {
    setCargando(true);
    setErrorTexto("");

    // Relación usuario - conciertos
    const { data: relaciones, error: errorRelaciones } = await supabase
      .from("usuarios_conciertos")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario);

    if (errorRelaciones) {
      setErrorTexto(errorRelaciones.message);
      setCargando(false);
      return;
    }

    const eventos = [];

    for (const relacion of relaciones) {
      // Concierto
      const { data: concierto, error: errorConcierto } = await supabase
        .from("concierto")
        .select("*")
        .eq("id_concierto", relacion.id_concierto)
        .maybeSingle();

      if (errorConcierto || !concierto) continue;

      // Artista
      const { data: artista } = await supabase
        .from("artista")
        .select("*")
        .eq("id_artista", concierto.id_artista)
        .maybeSingle();

      // Estadio
      const { data: estadio } = await supabase
        .from("estadio")
        .select("*")
        .eq("id_estadio", concierto.id_estadio)
        .maybeSingle();

      eventos.push({
        ...concierto,

        artista: artista || {
          nombre: "Artista",
        },

        estadio: estadio || {
          nombre: "Estadio",
          ciudad: "",
        },

        imagen:
          concierto.imagen ||
          concierto.imagenConcierto ||
          concierto.foto ||
          "",
      });
    }

    setMisEventos(eventos);
    setCargando(false);
  }

  return (
    <div className="pantallaMisEventos">
      <HeaderMisEventos onIrMisGrupos={onIrMisGrupos} />

      <main className="misEventosLayout">
        {cargando && (
          <p className="mensajeMisEventos">
            Cargando eventos...
          </p>
        )}

        {!cargando && errorTexto && (
          <p className="mensajeMisEventos">
            {errorTexto}
          </p>
        )}

        {!cargando &&
          !errorTexto &&
          misEventos.length === 0 && (
            <p className="mensajeMisEventos">
              Todavía no estás asociado a ningún evento.
            </p>
          )}

        {!cargando &&
          misEventos.map((evento) => (
            <CardEvento
              key={evento.id_concierto}
              evento={evento}
              onIngresar={onIngresar}
            />
          ))}
      </main>

      <Footer />
    </div>
  );
}

export default MisEventos;