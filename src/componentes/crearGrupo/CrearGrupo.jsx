import { useState } from "react";
import { supabase } from "../../supabase";
import "./CrearGrupo.css";

import HeaderCrearGrupo from "./HeaderCrearGrupo";
import FormCrearGrupo from "./FormCrearGrupo";
import DescartarCambios from "./DescartarCambios";

const IMAGEN_GRUPO_DEFAULT =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819";

const BUCKET_IMAGENES_GRUPOS = "imagenes-grupos";

const MENSAJE_ERROR_GENERICO =
  "No se pudo crear el grupo. Revisá los datos e intentá otra vez.";

function CrearGrupo({ concierto, idUsuarioActual, onVolver, onGrupoCreado }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorTexto, setErrorTexto] = useState("");

  const [formulario, setFormulario] = useState({
  nombre: "",
  ubicacion: "", 
  fecha: "",
  hora: "",
  descripcion: "",
  categoria: "pre",
  foto: "",
  imagenPreview: "",
});

  function hayCambios() {
    return (
      formulario.nombre.trim() !== "" ||
      formulario.ubicacion.trim() !== "" ||
      formulario.fecha.trim() !== "" ||
      formulario.hora.trim() !== "" ||
      formulario.descripcion.trim() !== "" ||
      formulario.categoria !== "pre" ||
formulario.foto.trim() !== ""    );
  }

  function manejarVolver() {
    if (hayCambios()) {
      setMostrarModal(true);
    } else {
      onVolver();
    }
  }

  async function obtenerNuevoIdGrupo() {
    const { data, error } = await supabase
      .from("grupo")
      .select("id_grupo")
      .order("id_grupo", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(MENSAJE_ERROR_GENERICO);
    }

    return data?.id_grupo ? data.id_grupo + 1 : 1;
  }

  async function obtenerNuevoIdRelacion() {
    const { data, error } = await supabase
      .from("grupos_usuarios")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(MENSAJE_ERROR_GENERICO);
    }

    return data?.id ? data.id + 1 : 1;
  }

  
  function validarFormulario() {
    if (!formulario.nombre.trim()) {
      return "Falta completar el nombre del grupo.";
    }

    if (!formulario.ubicacion.trim()) {
      return "Falta completar la ubicación del grupo.";
    }

    if (formulario.ubicacion.trim().length < 6) {
      return "Escribí una ubicación más específica.";
    }

    if (!formulario.fecha) {
      return "Falta elegir la fecha del grupo.";
    }

    if (!formulario.hora) {
      return "Falta elegir la hora del grupo.";
    }

    if (!concierto?.id_concierto || !idUsuarioActual) {
      return MENSAJE_ERROR_GENERICO;
    }

    return "";
  }

  async function crearGrupo(e) {
    e.preventDefault();
    setErrorTexto("");

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setErrorTexto(errorValidacion);
      return;
    }

    setGuardando(true);

    try {
      const nuevoIdGrupo = await obtenerNuevoIdGrupo();
const fotoGrupo = formulario.foto || IMAGEN_GRUPO_DEFAULT;
      const nuevoGrupo = {
        id_grupo: nuevoIdGrupo,
        nombre: formulario.nombre.trim(),
        ubicacion: formulario.ubicacion.trim(),
        fecha: formulario.fecha,
        hora: formulario.hora,
        descripcion: formulario.descripcion.trim(),
        categoria: formulario.categoria,
        id_concierto: concierto.id_concierto,
        id_creador: idUsuarioActual,
        foto: fotoGrupo,
      };

      const { data: grupoCreado, error: errorGrupo } = await supabase
        .from("grupo")
        .insert([nuevoGrupo])
        .select()
        .single();

      if (errorGrupo) {
        console.log("ERROR INSERT GRUPO:", errorGrupo);
        throw new Error(MENSAJE_ERROR_GENERICO);
      }

      const nuevoIdRelacion = await obtenerNuevoIdRelacion();

      const relacionGrupoUsuario = {
        id: nuevoIdRelacion,
        id_grupo: grupoCreado.id_grupo,
        id_usuario: idUsuarioActual,
      };

      const { error: errorRelacion } = await supabase
        .from("grupos_usuarios")
        .insert([relacionGrupoUsuario]);

      if (errorRelacion) {
        console.log("ERROR RELACION:", errorRelacion);
        setErrorTexto("El grupo se creó, pero no se pudo agregarte como integrante.");
        setGuardando(false);
        return;
      }

      setGuardando(false);
      onGrupoCreado();
    } catch (error) {
      setErrorTexto(error?.message || MENSAJE_ERROR_GENERICO);
      setGuardando(false);
    }
  }

  return (
    <div className="crearGrupoPantalla">
      <HeaderCrearGrupo onVolver={manejarVolver} />

      <main className="crearGrupoMain">
        <FormCrearGrupo
          formulario={formulario}
          setFormulario={setFormulario}
          crearGrupo={crearGrupo}
          guardando={guardando}
          errorTexto={errorTexto}
        />
      </main>

      {mostrarModal && (
        <DescartarCambios
          onDescartar={onVolver}
          onCancelar={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}

export default CrearGrupo;