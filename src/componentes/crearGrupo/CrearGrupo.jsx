import { useContext, useState } from "react";
import { gruposService } from "../../services/gruposService";
import "./CrearGrupo.css";

import HeaderCrearGrupo from "./HeaderCrearGrupo";
import FondoAmbiente from "../generales/FondoAmbiente";
import FormCrearGrupo from "./FormCrearGrupo";
import DescartarCambios from "./DescartarCambios";
import { UsuarioContext } from "../../context/UsuarioContext";

const IMAGEN_GRUPO_DEFAULT =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819";

const MENSAJE_ERROR_GENERICO =
  "No se pudo crear el grupo. Revisá los datos e intentá otra vez.";

const CAMPOS_DE_TEXTO = ["nombre", "ubicacion", "fecha", "hora", "descripcion", "categoria"];

function formularioInicial(grupo) {
  return {
    nombre: grupo?.nombre || "",
    ubicacion: grupo?.ubicacion || "",
    fecha: grupo?.fecha ? String(grupo.fecha).slice(0, 10) : "",
    // <input type="time"> quiere "19:00", la base guarda "19:00:00".
    hora: grupo?.hora ? String(grupo.hora).slice(0, 5) : "",
    descripcion: grupo?.descripcion || "",
    categoria: grupo?.categoria || "pre",
    limitado: Boolean(grupo?.cupo),
    cupo: grupo?.cupo ? String(grupo.cupo) : "",
    imagenArchivo: null,
    imagenPreview: grupo?.foto || "",
  };
}

// Con `grupo` edita ese grupo (solo lo ve su creador); sin él crea uno nuevo.
function CrearGrupo({ concierto, grupo, onVolver, onGrupoCreado }) {
  const editando = Boolean(grupo);
  const { usuarioActual } = useContext(UsuarioContext);
  const idUsuarioActual = usuarioActual?.id_usuario;
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorTexto, setErrorTexto] = useState("");

  const [original] = useState(() => formularioInicial(grupo));
  const [formulario, setFormulario] = useState(original);

  // null = sin límite.
  function cupoElegido(datos) {
    return datos.limitado ? Number(datos.cupo) : null;
  }

  function hayCambios() {
    return (
      CAMPOS_DE_TEXTO.some((campo) => formulario[campo].trim() !== original[campo].trim()) ||
      cupoElegido(formulario) !== cupoElegido(original) ||
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

    if (formulario.limitado) {
      const cupo = Number(formulario.cupo);
      if (!Number.isInteger(cupo) || cupo < 2 || cupo > 500) {
        return "El cupo tiene que ser un número entre 2 y 500 (vos contás como uno).";
      }
      const integrantes = grupo?.usuarios?.length || 0;
      if (cupo < integrantes) {
        return `Ya hay ${integrantes} integrantes: el cupo no puede ser menor.`;
      }
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

    if (editando) {
      await guardarCambios();
      return;
    }

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
        cupo: cupoElegido(formulario),
      };

      await gruposService.crear(nuevoGrupo);

      setGuardando(false);
      onGrupoCreado();
    } catch (error) {
      setErrorTexto(error?.message || MENSAJE_ERROR_GENERICO);
      setGuardando(false);
    }
  }

  // Solo se mandan los campos que cambiaron (y la foto si eligió una nueva).
  async function guardarCambios() {
    const cambios = {};
    for (const campo of CAMPOS_DE_TEXTO) {
      const valor = formulario[campo].trim();
      if (valor !== original[campo].trim()) cambios[campo] = valor;
    }
    if (cupoElegido(formulario) !== cupoElegido(original)) {
      cambios.cupo = cupoElegido(formulario);
    }

    try {
      if (formulario.imagenArchivo) {
        cambios.foto = await convertirImagenABase64(formulario.imagenArchivo);
      }

      if (Object.keys(cambios).length === 0) {
        setGuardando(false);
        onVolver();
        return;
      }

      const grupoActualizado = await gruposService.actualizar(grupo.id_grupo, cambios);
      setGuardando(false);
      onGrupoCreado(grupoActualizado);
    } catch (error) {
      setErrorTexto(error?.message || "No se pudo guardar el grupo. Intentá otra vez.");
      setGuardando(false);
    }
  }

  return (
    <div className="crearGrupoPantalla">
      <FondoAmbiente imagen={formulario.imagenPreview || concierto?.imagen} />
      <HeaderCrearGrupo onVolver={manejarVolver} titulo={editando ? "Editar grupo" : undefined} />

      <main className="crearGrupoMain">
        <FormCrearGrupo
          formulario={formulario}
          setFormulario={setFormulario}
          crearGrupo={crearGrupo}
          guardando={guardando}
          errorTexto={errorTexto}
          concierto={concierto}
          imagenDefault={IMAGEN_GRUPO_DEFAULT}
          editando={editando}
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