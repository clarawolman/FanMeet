import { useEffect, useState } from "react";
import "./MisGrupos.css";

import { supabase } from "../../supabase";

import HeaderMisGrupos from "./HeaderMisGrupos";
import CardGrupo from "./CardGrupo";
import Footer from "../generales/Footer";

function MisGrupos({
  usuarioActual,
  onAbrirGrupo,
  onVolver,
  onNavegar,
}) {
  const [misGrupos, setMisGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarMisGrupos();
    }
  }, [usuarioActual]);

  async function cargarMisGrupos() {
    setCargando(true);
    setErrorTexto("");

    const { data: relaciones, error: errorRelaciones } = await supabase
      .from("grupos_usuarios")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario);

    if (errorRelaciones) {
      setErrorTexto("No se pudieron cargar tus grupos.");
      setCargando(false);
      return;
    }

    const grupos = [];

    for (const relacion of relaciones || []) {
      const { data: grupo } = await supabase
        .from("grupo")
        .select("*")
        .eq("id_grupo", relacion.id_grupo)
        .maybeSingle();


      const { data: concierto } = await supabase
        .from("concierto")
        .select(`
        *,
        artista (*),
        estadio (*)
      `)
        .eq("id_concierto", grupo.id_concierto)
        .maybeSingle();



      const { data: integrantes } = await supabase
        .from("grupos_usuarios")
        .select("*")
        .eq("id_grupo", grupo.id_grupo);

      const usuarios = [];

      for (const integrante of integrantes || []) {
        const { data: usuario } = await supabase
          .from("usuario")
          .select("*")
          .eq("id_usuario", integrante.id_usuario)
          .maybeSingle();

        if (usuario) {
          usuarios.push({
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            foto_perfil:
              usuario.fotoperfil ||
              "https://i.pinimg.com/originals/31/ec/2c/31ec2ce212492e600b8de27f38846ed7.jpg",
          });
        }
      }

      grupos.push({
        ...grupo,
        concierto: concierto || null,
        usuarios,
      });
    }

    setMisGrupos(grupos);
    setCargando(false);
  }
  const gruposPorConcierto = misGrupos.reduce((acumulador, grupo) => {
    const idConcierto = String(grupo.id_concierto || "sin-concierto");

    if (!acumulador[idConcierto]) {
      acumulador[idConcierto] = {
        id_concierto: idConcierto,
        concierto: grupo.concierto,
        grupos: [],
      };
    }

    acumulador[idConcierto].grupos.push(grupo);

    return acumulador;
  }, {});

  const seccionesConciertos = Object.values(gruposPorConcierto);

  function obtenerNombreConcierto(seccion) {
    return (
      seccion.concierto?.nombre ||
      seccion.concierto?.artista?.nombre ||
      `Concierto ${seccion.id_concierto}`
    );
  }

  return (
    <div className="pantallaMisGrupos">
      <HeaderMisGrupos onVolver={onVolver} />

      <main className="misGruposLayout">
        {cargando && (
          <p className="mensajeMisGrupos">Cargando grupos...</p>
        )}

        {!cargando && errorTexto && (
          <p className="mensajeMisGrupos">{errorTexto}</p>
        )}

        {!cargando && !errorTexto && misGrupos.length === 0 && (
          <p className="mensajeMisGrupos">
            Todavía no participás en ningún grupo.
          </p>
        )}

        {!cargando && !errorTexto && (
          <div className="misGruposCatalogo">
            {seccionesConciertos.map((seccion) => (
              <section className="misGruposRow" key={seccion.id_concierto}>
                <div className="misGruposRowHeader">
                  <h2>{obtenerNombreConcierto(seccion)}</h2>
                  <span>{seccion.grupos.length}</span>
                </div>

                <div className="misGruposRowScroll">
                  {seccion.grupos.map((grupo) => (
                    <CardGrupo
                      key={grupo.id_grupo}
                      grupo={grupo}
                      onAbrirGrupo={() => onAbrirGrupo(grupo)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer onNavegar={onNavegar} pantallaActiva="misGrupos" />
    </div>
  );
}

export default MisGrupos;