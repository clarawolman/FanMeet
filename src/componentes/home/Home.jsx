import { useEffect, useState } from "react";
import "./Home.css";
import { supabase } from "../../supabase";
import HeaderHome from "./HeaderHome";
import BienvenidaHome from "./BienvenidaHome";
import FiltrosHome from "./FiltrosHome";
import CardConciertoHome from "./CardConciertoHome";
import OverlayCodigo from "./OverlayCodigo";

function Home({ usuarioActual, onEntrarConcierto }) {
  const [conciertos, setConciertos] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [conciertoSeleccionado, setConciertoSeleccionado] = useState(null);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [errorCodigo, setErrorCodigo] = useState("");
  const [cargando, setCargando] = useState(true);
  const CODIGO_PRUEBA = "FANMEET2026";

  const conciertosFiltrados =
  filtroActivo === "todos"
    ? conciertos
    : conciertos.filter(
        (concierto) =>
          String(concierto.id_estiloMusical) === String(filtroActivo)
      );

  console.log("FILTRO ACTIVO:", filtroActivo);

  const filtros = [
    { id: "todos", nombre: "Todos" },
    { id: "1", nombre: "Pop" },
    { id: "2", nombre: "Rock" },
    { id: "3", nombre: "Urbano" },
    { id: "4", nombre: "Indie" },
  ];

  useEffect(() => {
    cargarConciertos();
  }, []);

  async function cargarConciertos() {
    setCargando(true);

    const { data, error } = await supabase
      .from("concierto")
      .select(`
        *,
        artista (*),
        estadio (*)
      `);

    if (error) {
      console.error("Error cargando conciertos:", error);
      setConciertos([]);
      setCargando(false);
      return;
    }

    setConciertos(data || []);
    setCargando(false);
  }

  async function abrirOverlay(concierto) {
    setErrorCodigo("");

    const { data, error } = await supabase
      .from("usuarios_conciertos")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("id_concierto", concierto.id_concierto)
      .maybeSingle();

    if (error) {
      console.error("Error verificando acceso:", error);
      return;
    }

    if (data) {
      await onEntrarConcierto(concierto.id_concierto);
      return;
    }

    setConciertoSeleccionado(concierto);
    setCodigoIngresado("");
  }

  function cerrarOverlay() {
    setConciertoSeleccionado(null);
    setCodigoIngresado("");
    setErrorCodigo("");
  }

  async function validarCodigo() {
    const CODIGO_PRUEBA = "FANMEET2026";

    if (codigoIngresado.trim() !== CODIGO_PRUEBA) {
      setErrorCodigo("Código incorrecto.");
      return;
    }

   const { error } = await supabase.from("usuarios_conciertos").insert([
      {
        id_usuario: usuarioActual.id_usuario,
        id_concierto: conciertoSeleccionado.id_concierto,
      },
    ]);
     /*const { error } = await supabase.from("usuarios_conciertos").upsert(
      [
        {
          id_usuario: usuarioActual.id_usuario,
          id_concierto: conciertoSeleccionado.id_concierto,
        },
      ],
      {
        onConflict: "id_usuario,id_concierto",
      }
    );*/

    /*if (error) {
      console.error("Error guardando acceso:", error);
      setErrorCodigo("El código está bien, pero no se pudo guardar el acceso.");
      return;
    }*/
      if (error) {
      console.error("Error guardando acceso:", error);
      setErrorCodigo("Error guardando acceso: " + error.message);
      return;
    }

    await onEntrarConcierto(conciertoSeleccionado.id_concierto);
  }


  return (
    <div className="pantalla-home">
      <header className="home-header">
        <div>
          <p className="home-eyebrow">FanMeet</p>
          <h1>Encontrá tu próximo show</h1>
        </div>

        <div className="home-usuario">
          <img
            src={
              usuarioActual?.fotoperfil ||
              usuarioActual?.foto_perfil ||
              "https://i.pinimg.com/originals/31/ec/2c/31ec2ce212492e600b8de27f38846ed7.jpg"
            }
            alt={usuarioActual?.nombre || "Usuario"}
          />
        </div>
      </header>

      <main className="home-main">
        <section className="home-bienvenida">
          <p>Hola, {usuarioActual?.nombre || "fan"}.</p>
          <h2>Más que un show, una conexión.</h2>
          <span>
            Explorá recitales, ingresá con tu código y conectá con personas que
            van al mismo evento.
          </span>
        </section>

        <section className="home-filtros">
          {filtros.map((filtro) => (
            <button
              key={filtro.id}
              className={
                filtroActivo === filtro.id
                  ? "home-filtro home-filtro--activo"
                  : "home-filtro"
              }
              onClick={() => setFiltroActivo(filtro.id)}
            >
              {filtro.nombre}
            </button>
          ))}
        </section>

        {cargando && <p className="home-estado">Cargando conciertos...</p>}

        {!cargando && conciertosFiltrados.length === 0 && (
          <p className="home-estado">No hay conciertos disponibles.</p>
        )}

        <section className="home-grid">
          {conciertosFiltrados.map((concierto) => (
            <article
              className="home-card"
              key={concierto.id_concierto}
              onClick={() => abrirOverlay(concierto)}
            >
              <div className="home-card-imagen">
                <img
                  src={
                    concierto.imagen ||
                    concierto.imagenConcierto ||
                    concierto.foto ||
                    ""
                  }
                  alt={concierto.nombre || concierto.artista?.nombre}
                />
              </div>

              <div className="home-card-info">
                <p>{concierto.artista?.nombre || "Artista"}</p>
                <h3>{concierto.nombre || concierto.artista?.nombre}</h3>

                <div className="home-card-meta">
                  <span>{concierto.fecha || "Fecha a confirmar"}</span>
                  <span>
                    {concierto.estadio?.nombre ||
                      concierto.estadio?.ciudad ||
                      "Estadio"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      {conciertoSeleccionado && (
        <div className="home-overlay">
          <div className="home-modal">
            <button className="home-modal-cerrar" onClick={cerrarOverlay}>
              ×
            </button>

            <p className="home-modal-eyebrow">Acceso al evento</p>
            <h2>{conciertoSeleccionado.nombre}</h2>
            <span>
              Ingresá el código que recibiste con tu entrada para desbloquear la
              comunidad del concierto.
            </span>

            <input
              type="text"
              value={codigoIngresado}
              onChange={(e) => {
                setCodigoIngresado(e.target.value);
                setErrorCodigo("");
              }}
              placeholder="Código de acceso"
            />

            {errorCodigo && <p className="home-error">{errorCodigo}</p>}

            <button className="home-btn-principal" onClick={validarCodigo}>
              Entrar al concierto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;