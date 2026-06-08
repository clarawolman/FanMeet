import { useState } from "react";
import { supabase } from "../../supabase";
import "./CrearGrupo.css";

import HeaderCrearGrupo from "./HeaderCrearGrupo";
import FormCrearGrupo from "./FormCrearGrupo";
import DescartarCambios from "./DescartarCambios";

const IMAGEN_GRUPO_DEFAULT =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819";

function CrearGrupo({ concierto, idUsuarioActual, onVolver, onGrupoCreado }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorTexto, setErrorTexto] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    ubicacion: "",
    fecha: "",
    descripcion: "",
    categoria: "pre",
    imagenArchivo: null,
    imagenPreview: "",
  });

  function hayCambios() {
    return (
      formulario.nombre.trim() !== "" ||
      formulario.ubicacion.trim() !== "" ||
      formulario.fecha.trim() !== "" ||
      formulario.descripcion.trim() !== "" ||
      formulario.categoria !== "pre" ||
      formulario.imagenArchivo !== null
    );
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
      throw new Error("No se pudo preparar el nuevo grupo.");
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
      throw new Error("No se pudo prepararte como integrante del grupo.");
    }

    return data?.id ? data.id + 1 : 1;
  }

  async function subirImagenGrupo(nuevoIdGrupo) {
    if (!formulario.imagenArchivo) {
      return IMAGEN_GRUPO_DEFAULT;
    }

    const archivo = formulario.imagenArchivo;
    const extension = archivo.name.split(".").pop();
    const nombreArchivo = `grupo-${nuevoIdGrupo}-${Date.now()}.${extension}`;

    const { error: errorUpload } = await supabase.storage
      .from("grupos")
      .upload(nombreArchivo, archivo);

    if (errorUpload) {
      console.log("ERROR AL SUBIR IMAGEN:", errorUpload);
      throw new Error("No se pudo subir la foto del grupo. Probá con otra imagen.");
    }

    const { data } = supabase.storage.from("grupos").getPublicUrl(nombreArchivo);

    return data.publicUrl;
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

    if (!concierto?.id_concierto) {
      return "No se encontró el concierto al que pertenece este grupo.";
    }

    if (!idUsuarioActual) {
      return "No se encontró el usuario actual.";
    }

    return "";
  }

  function obtenerMensajeError(error) {
    const mensaje = error?.message || "";

    const columnaFaltante = mensaje.match(/column "(.+?)"/)?.[1];

    if (columnaFaltante === "id_creador") {
      return "No se pudo crear el grupo porque no se encontró el creador.";
    }

    if (columnaFaltante === "id_concierto") {
      return "No se pudo crear el grupo porque no se encontró el concierto.";
    }

    if (columnaFaltante === "id_grupo") {
      return "No se pudo crear el grupo porque no se generó su identificador.";
    }

    if (columnaFaltante === "imagen") {
      return "No se pudo crear el grupo porque falta la imagen.";
    }

    if (columnaFaltante) {
      return `No se pudo crear el grupo porque falta completar: ${columnaFaltante}`;
    }

    if (mensaje.includes("duplicate key")) {
      return "No se pudo crear el grupo por un problema de identificador. Probá de nuevo.";
    }

    if (mensaje.includes("schema cache")) {
      return "No se pudo crear el grupo porque hay una columna que no existe en la base de datos.";
    }

    return "No se pudo crear el grupo. Revisá los datos e intentá otra vez.";
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
      const imagenUrl = await subirImagenGrupo(nuevoIdGrupo);

      const nuevoGrupo = {
        id_grupo: nuevoIdGrupo,
        nombre: formulario.nombre.trim(),
        ubicacion: formulario.ubicacion.trim(),
        fecha: formulario.fecha,
        descripcion: formulario.descripcion.trim(),
        categoria: formulario.categoria,
        id_concierto: concierto.id_concierto,
        id_creador: idUsuarioActual,
        imagen: imagenUrl,
      };

      console.log("GRUPO A INSERTAR:", nuevoGrupo);

      const { data: grupoCreado, error: errorGrupo } = await supabase
        .from("grupo")
        .insert([nuevoGrupo])
        .select()
        .single();

      if (errorGrupo) {
        console.log("ERROR REAL AL CREAR GRUPO:", errorGrupo);
        throw errorGrupo;
      }

      console.log("GRUPO CREADO:", grupoCreado);

      const nuevoIdRelacion = await obtenerNuevoIdRelacion();

      const relacionGrupoUsuario = {
        id: nuevoIdRelacion,
        id_grupo: grupoCreado.id_grupo,
        id_usuario: idUsuarioActual,
      };

      console.log("RELACION A INSERTAR:", relacionGrupoUsuario);

      const { error: errorRelacion } = await supabase
        .from("grupos_usuarios")
        .insert([relacionGrupoUsuario]);

      if (errorRelacion) {
        console.log("ERROR REAL AL UNIR USUARIO AL GRUPO:", errorRelacion);
        setErrorTexto("El grupo se creó, pero no se pudo agregarte como integrante.");
        setGuardando(false);
        return;
      }

      setGuardando(false);
      onGrupoCreado();
    } catch (error) {
      console.log("ERROR FINAL CREAR GRUPO:", error);
      setErrorTexto(obtenerMensajeError(error));
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