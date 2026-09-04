import { useState } from "react";
import { gruposService } from "../../services/gruposService";
import "./CrearGrupo.css";

import HeaderCrearGrupo from "./HeaderCrearGrupo";
import FormCrearGrupo from "./FormCrearGrupo";
import DescartarCambios from "./DescartarCambios";

const IMAGEN_GRUPO_DEFAULT =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819";

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
    imagenArchivo: null,
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

  function convertirImagenABase64(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();

      lector.onload = () => {
        resolve(lector.result);
      };

      lector.onerror = () => {
        reject(new Error("No se pudo cargar la imagen. Probá con otra foto."));
      };

      lector.readAsDataURL(archivo);
    });
  }

  async function obtenerImagenGrupo() {
    if (!formulario.imagenArchivo) {
      return IMAGEN_GRUPO_DEFAULT;
    }

    return await convertirImagenABase64(formulario.imagenArchivo);
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
      const imagenUrl = await obtenerImagenGrupo();

      // id_creador ya no se manda: el backend lo determina desde la
      // sesión autenticada (req.user.id), no desde un valor de React.
      const nuevoGrupo = {
        nombre: formulario.nombre.trim(),
        ubicacion: formulario.ubicacion.trim(),
        fecha: formulario.fecha,
        hora: formulario.hora,
        descripcion: formulario.descripcion.trim(),
        categoria: formulario.categoria,
        id_concierto: concierto.id_concierto,
        foto: imagenUrl,
      };

      await gruposService.crear(nuevoGrupo);

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