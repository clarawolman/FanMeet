import { useEffect, useState } from "react";
import "./MisEventos.css";

import { supabase } from "../../supabase";

import HeaderMisEventos from "./HeaderMisEventos";
import CardEvento from "./CardEvento";
import Footer from "../generales/Footer";
import ModalConfirmacion from "../generales/ModalConfirmacion";

function MisEventos({
  usuarioActual,
  onIngresar,
  onIrMisGrupos,
  onNavegar,
}) {
  const [misEventos, setMisEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");
  const [eventoParaSalir, setEventoParaSalir] = useState(null);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarMisEventos();
    }
  }, [usuarioActual]);

  async function cargarMisEventos() {
    setCargando(true);
    setErrorTexto("");

    const { data: relaciones, error: errorRelaciones } = await supabase
      .from("usuarios_conciertos")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario);

    if (errorRelaciones) {
      console.error("Error cargando relaciones:", errorRelaciones);
      setErrorTexto("No se pudieron cargar tus eventos.");
      setCargando(false);
      return;
    }

    const eventos = [];

    for (const relacion of relaciones || []) {
      const { data: concierto, error: errorConcierto } = await supabase
        .from("concierto")
        .select("*")
        .eq("id_concierto", relacion.id_concierto)
        .maybeSingle();

      if (errorConcierto || !concierto) {
        console.error("Error cargando concierto:", errorConcierto);
        continue;
      }

      const { data: artista } = await supabase
        .from("artista")
        .select("*")
        .eq("id_artista", concierto.id_artista)
        .maybeSingle();

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

  async function confirmarSalirDelConcierto() {
    if (!eventoParaSalir) return;

    setSaliendo(true);

    // Salir de un concierto también saca a la persona de todos los
    // grupos que haya confirmado dentro de ese concierto: no tendría
    // sentido seguir en el grupo de un evento al que ya no vas.
    const { data: gruposDelConcierto, error: errorGrupos } = await supabase
      .from("grupo")
      .select("id_grupo")
      .eq("id_concierto", eventoParaSalir.id_concierto);

    if (errorGrupos) {
      console.error("Error buscando grupos del concierto:", errorGrupos);
    }

    const idsGrupos = (gruposDelConcierto || []).map((grupo) => grupo.id_grupo);

    if (idsGrupos.length > 0) {
      const { error: errorSalirGrupos } = await supabase
        .from("grupos_usuarios")
        .delete()
        .eq("id_usuario", usuarioActual.id_usuario)
        .in("id_grupo", idsGrupos);

      if (errorSalirGrupos) {
        console.error("Error saliendo de los grupos del concierto:", errorSalirGrupos);
      }
    }

    const { error: errorSalirConcierto } = await supabase
      .from("usuarios_conciertos")
      .delete()
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("id_concierto", eventoParaSalir.id_concierto);

    setSaliendo(false);

    if (errorSalirConcierto) {
      alert("No se pudo salir del concierto: " + errorSalirConcierto.message);
      return;
    }

    setEventoParaSalir(null);
    await cargarMisEventos();
  }

  return (
    <div className="pantallaMisEventos">
      <HeaderMisEventos onIrMisGrupos={onIrMisGrupos} />

      <main className="misEventosLayout">
        {cargando && (
          <p className="mensajeMisEventos">Cargando eventos...</p>
        )}

        {!cargando && errorTexto && (
          <p className="mensajeMisEventos">{errorTexto}</p>
        )}

        {!cargando && !errorTexto && misEventos.length === 0 && (
          <p className="mensajeMisEventos">
            Todavía no estás asociado a ningún evento.
          </p>
        )}

        {!cargando &&
          !errorTexto &&
          misEventos.map((evento) => (
            <CardEvento
              key={evento.id_concierto}
              evento={evento}
              onIngresar={() => onIngresar(evento)}
              onSalir={setEventoParaSalir}
            />
          ))}
      </main>

      {eventoParaSalir && (
        <ModalConfirmacion
          mensaje={`¿Salir de ${eventoParaSalir.artista?.nombre || "este concierto"}? También vas a salir de los grupos que tengas ahí.`}
          textoConfirmar="Salir del concierto"
          textoCancelar="Cancelar"
          confirmando={saliendo}
          onConfirmar={confirmarSalirDelConcierto}
          onCancelar={() => setEventoParaSalir(null)}
        />
      )}

      <Footer onNavegar={onNavegar} pantallaActiva="misEventos" />
    </div>
  );
}

export default MisEventos;