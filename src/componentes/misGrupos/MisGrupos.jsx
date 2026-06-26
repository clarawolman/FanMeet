import { useEffect, useState } from "react";
import "./MisGrupos.css";

import { supabase } from "../../supabase";

import HeaderMisGrupos from "./HeaderMisGrupos";
import CardGrupo from "./CardGrupo";
import Footer from "../generales/Footer";

function MisGrupos({ usuarioActual, onAbrirGrupo, onVolver }) {
  const [misGrupos, setMisGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuarioActual) {
      cargarMisGrupos();
    }
  }, [usuarioActual]);

  async function cargarMisGrupos() {
    setCargando(true);

    // Grupos donde participa el usuario
    const { data: relaciones } = await supabase
      .from("grupos_usuarios")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario);

    if (!relaciones) {
      setMisGrupos([]);
      setCargando(false);
      return;
    }

    const grupos = [];

    for (const relacion of relaciones) {
      const { data: grupo } = await supabase
        .from("grupo")
        .select("*")
        .eq("id_grupo", relacion.id_grupo)
        .maybeSingle();

      if (!grupo) continue;

      // Usuarios del grupo
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
        usuarios,
      });
    }

    setMisGrupos(grupos);
    setCargando(false);
  }

  return (
    <div className="pantallaMisGrupos">
      <HeaderMisGrupos onVolver={onVolver} />

      <main className="misGruposLayout">

        {cargando && (
          <p className="mensajeMisGrupos">
            Cargando grupos...
          </p>
        )}

        {!cargando &&
          misGrupos.map((grupo) => (
            <CardGrupo
              key={grupo.id_grupo}
              grupo={grupo}
              onAbrirGrupo={onAbrirGrupo}
            />
          ))}

        {!cargando && misGrupos.length === 0 && (
          <p className="mensajeMisGrupos">
            Todavía no participás en ningún grupo.
          </p>
        )}
      </main>

      <Footer onNavegar={onNavegar} />    
    </div>
  );
}

export default MisGrupos;