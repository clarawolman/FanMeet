import { grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { notificacionRepository } from "../repositories/notificacionRepository.js";

// La foto no se avisa: no cambia nada del encuentro.
const NOMBRES_CAMPO = {
  nombre: "el nombre",
  categoria: "el tipo",
  fecha: "la fecha",
  hora: "la hora",
  ubicacion: "el punto de encuentro",
  descripcion: "la descripción",
};

const CATEGORIAS = { pre: "previa", after: "after", mismo_dia: "mismo día", comunidad: "comunidad" };

// La base guarda "2026-10-20" y "18:00:00"; el formulario manda "18:00".
function comparable(campo, valor) {
  const texto = String(valor ?? "").trim();
  if (campo === "fecha") return texto.slice(0, 10);
  if (campo === "hora") return texto.slice(0, 5);
  return texto;
}

export function camposCambiados(anterior, actualizado) {
  return Object.keys(NOMBRES_CAMPO).filter(
    (campo) => comparable(campo, anterior[campo]) !== comparable(campo, actualizado[campo])
  );
}

function enLista(partes) {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

// "Cambió la hora y el punto de encuentro. Ahora: 20/10 a las 18:00 en Parque Patricios."
export function textoDelAviso(campos, grupo) {
  let texto = `Cambió ${enLista(campos.map((c) => NOMBRES_CAMPO[c]))} del grupo.`;
  if (grupo.categoria === "comunidad") {
    // Pasó a ser un grupo sin encuentro: no hay fecha ni lugar que mostrar.
    if (campos.includes("categoria")) texto += " Ahora es un grupo de comunidad, sin encuentro.";
  } else if (campos.some((c) => ["fecha", "hora", "ubicacion"].includes(c))) {
    const [, mes, dia] = comparable("fecha", grupo.fecha).split("-");
    texto += ` Ahora: ${dia}/${mes} a las ${comparable("hora", grupo.hora)} en ${grupo.ubicacion}.`;
  } else if (campos.includes("categoria")) {
    texto += ` Ahora es ${CATEGORIAS[grupo.categoria] || grupo.categoria}.`;
  }
  return texto;
}

// Le avisa a los integrantes del grupo qué cambió (menos a quien lo cambió).
// Si falla el aviso, el cambio ya quedó guardado: se loguea y sigue.
// Devuelve a cuántos se avisó.
export async function avisarCambiosDeGrupo(anterior, actualizado, { excepto } = {}) {
  const campos = camposCambiados(anterior, actualizado);
  if (campos.length === 0) return 0;

  try {
    const integrantes = await grupoUsuarioRepository.listarUsuariosPorGrupo(actualizado.id_grupo);
    const destinatarios = [...new Set(integrantes.map((i) => i.id_usuario))].filter((id) => id !== excepto);
    if (destinatarios.length === 0) return 0;

    const descripcion = textoDelAviso(campos, actualizado);
    await notificacionRepository.crearVarias(
      destinatarios.map((idUsuario) => ({
        id_usuario: idUsuario,
        tipo: "cambio_grupo",
        titulo: actualizado.nombre,
        descripcion,
        imagen: actualizado.foto || "",
        id_grupo: actualizado.id_grupo,
        id_concierto: actualizado.id_concierto,
      }))
    );
    return destinatarios.length;
  } catch (error) {
    console.error("No se pudo avisar el cambio del grupo:", error);
    return 0;
  }
}
