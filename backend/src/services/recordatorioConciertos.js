import { conciertoRepository, usuariosConciertosRepository } from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { notificacionRepository } from "../repositories/notificacionRepository.js";
import { recordatorioRepository } from "../repositories/recordatorioRepository.js";
import { hoyEnArgentina, horaEnArgentina, diaSiguiente } from "../helpers/fechas.js";
import { CATEGORIA_COMUNIDAD, esGrupoGeneral } from "../helpers/gruposGenerales.js";
import { DIAS_RECORDATORIO, preferenciasDe } from "../helpers/preferencias.js";

// Antes de esta hora (de Argentina) no se manda nada: nadie quiere una
// notificación a las 3 de la mañana. El chequeo de las 9 manda los del día.
export const HORA_DESDE = 9;

// "2026-10-20T21:00:00" -> "21:00"; "18:00:00" -> "18:00".
function horaCorta(valor) {
  const texto = String(valor ?? "");
  const hora = texto.includes("T") ? texto.split("T")[1] : texto;
  return hora.slice(0, 5);
}

function enLista(partes) {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

// «Previa» a las 18:00 en Parque Patricios (con el día si no es hoy: la
// previa o el after pueden ser otro día).
function datosDelGrupo(grupo, hoy) {
  const dia = String(grupo.fecha ?? "").slice(0, 10);
  let texto = `«${grupo.nombre}»`;
  if (dia && dia !== hoy) {
    const [, mes, d] = dia.split("-");
    texto += ` el ${d}/${mes}`;
  }
  if (grupo.hora) texto += ` a las ${horaCorta(grupo.hora)}`;
  if (grupo.ubicacion) texto += ` en ${grupo.ubicacion}`;
  return texto;
}

// Cada uno elige en Configuración cuántos días antes le llega (0 = el día del show)
const TITULOS = {
  0: "¡Hoy es el show!",
  1: "¡Mañana es el show!",
  7: "Falta una semana para el show",
};
const CUANDO = { 0: "Hoy", 1: "Mañana", 7: "En una semana" };

// "Hoy es Iron Maiden, a las 21:00 en Estadio River. Tu grupo «Previa» se
// encuentra a las 18:00 en Parque Patricios."
// `dia` es el día del show (con aviso anticipado, no es hoy).
export function textoRecordatorio(concierto, grupos = [], diaShow = hoyEnArgentina(), diasAntes = 0) {
  let texto = `${CUANDO[diasAntes]} es ${concierto.nombre}, a las ${horaCorta(concierto.fecha)}`;
  if (concierto.estadio?.nombre) texto += ` en ${concierto.estadio.nombre}`;
  texto += ".";

  if (grupos.length === 1) {
    texto += ` Tu grupo ${datosDelGrupo(grupos[0], diaShow)}.`;
  } else if (grupos.length > 1) {
    texto += ` Tus grupos: ${enLista(grupos.map((g) => datosDelGrupo(g, diaShow)))}.`;
  }
  return texto;
}

// Los grupos que se nombran en el recordatorio: los de comunidad no tienen
// encuentro, y uno general (varias fechas) solo si se juntan hoy o esta
// noche, no en cada una de sus fechas.
function gruposParaRecordar(grupos, hoy) {
  return grupos.filter((g) => {
    if (g.categoria === CATEGORIA_COMUNIDAD) return false;
    if (!esGrupoGeneral(g)) return true;
    const dia = String(g.fecha ?? "").slice(0, 10);
    return dia === hoy || dia === diaSiguiente(hoy);
  });
}

// Manda el recordatorio de un concierto a los unidos que todavía no lo
// recibieron hoy y lo quieren `diasAntes` días antes del show. Devuelve a
// cuántos les llegó.
async function recordarConcierto(concierto, hoy, diaShow = hoy, diasAntes = 0) {
  const [unidos, todosLosGrupos, suspendidos] = await Promise.all([
    usuariosConciertosRepository.listarUsuariosPorConcierto(concierto.id_concierto),
    grupoRepository.listarPorConcierto(concierto.id_concierto),
    usuarioRepository.listarIdsSuspendidos(),
  ]);
  const grupos = gruposParaRecordar(todosLosGrupos, diaShow);
  const activos = [...new Set(unidos.map((u) => u.id_usuario))].filter((id) => !suspendidos.has(id));
  if (activos.length === 0) return 0;

  const filasUsuarios = new Map(
    (await usuarioRepository.listarPorIds(activos)).map((u) => [u.id_usuario, u])
  );
  const destinatarios = activos.filter((id) =>
    preferenciasDe(filasUsuarios.get(id)).recordatorio_dias.includes(diasAntes)
  );
  if (destinatarios.length === 0) return 0;

  const reservados = await recordatorioRepository.reservar(
    destinatarios.map((idUsuario) => ({
      id_concierto: concierto.id_concierto,
      id_usuario: idUsuario,
      fecha: hoy,
    }))
  );
  const ids = reservados.map((r) => r.id_usuario);
  if (ids.length === 0) return 0;

  try {
    const integrantes = await grupoUsuarioRepository.listarUsuariosPorGrupos(
      grupos.map((g) => g.id_grupo)
    );
    const gruposPorId = new Map(grupos.map((g) => [g.id_grupo, g]));
    const gruposDe = new Map();
    for (const { id_grupo, id_usuario } of integrantes) {
      if (!gruposDe.has(id_usuario)) gruposDe.set(id_usuario, []);
      gruposDe.get(id_usuario).push(gruposPorId.get(id_grupo));
    }

    await notificacionRepository.crearVarias(
      ids.map((idUsuario) => {
        const susGrupos = gruposDe.get(idUsuario) || [];
        return {
          id_usuario: idUsuario,
          tipo: "recordatorio_concierto",
          titulo: TITULOS[diasAntes],
          descripcion: textoRecordatorio(concierto, susGrupos, diaShow, diasAntes),
          imagen: concierto.imagenConcierto || "",
          id_concierto: concierto.id_concierto,
          // Con un solo grupo queda asociado; con varios, solo el concierto.
          id_grupo: susGrupos.length === 1 ? susGrupos[0].id_grupo : null,
        };
      })
    );
  } catch (error) {
    await recordatorioRepository.liberar(concierto.id_concierto, hoy, ids).catch((e) =>
      console.error("No se pudieron liberar los recordatorios:", e)
    );
    throw error;
  }
  return ids.length;
}

function sumarDias(dia, cantidad) {
  let resultado = dia;
  for (let i = 0; i < cantidad; i++) resultado = diaSiguiente(resultado);
  return resultado;
}

// Manda los recordatorios de los conciertos de hoy (hora de Argentina).
// Se puede llamar las veces que haga falta: lo ya enviado no se repite.
// Devuelve a cuántos les llegó en esta pasada.
export async function enviarRecordatoriosDeHoy({ ahora = new Date() } = {}) {
  if (horaEnArgentina(ahora) < HORA_DESDE) return 0;

  const hoy = hoyEnArgentina(ahora);

  let enviados = 0;
  for (const diasAntes of DIAS_RECORDATORIO) {
    const diaShow = sumarDias(hoy, diasAntes);
    const conciertos = await conciertoRepository.listarDelDia(diaShow, diaSiguiente(diaShow));
    for (const concierto of conciertos) {
      try {
        enviados += await recordarConcierto(concierto, hoy, diaShow, diasAntes);
      } catch (error) {
        // Un concierto que falla no frena a los demás; se reintenta en el
        // próximo chequeo.
        console.error(`No se pudo mandar el recordatorio del concierto ${concierto.id_concierto}:`, error);
      }
    }
  }
  return enviados;
}

// Chequeo periódico mientras corre el server: uno al arrancar y después
// cada `minutos`. Devuelve una función para frenarlo.
export function programarRecordatorios(minutos) {
  let corriendo = false;

  async function chequear() {
    if (corriendo) return; // el anterior todavía no terminó
    corriendo = true;
    try {
      const enviados = await enviarRecordatoriosDeHoy();
      if (enviados > 0) console.log(`Recordatorios del día enviados: ${enviados}`);
    } catch (error) {
      console.error("Error mandando los recordatorios del día:", error);
    } finally {
      corriendo = false;
    }
  }

  chequear();
  const intervalo = setInterval(chequear, minutos * 60 * 1000);
  // No mantiene vivo el proceso por sí solo.
  intervalo.unref();
  return () => clearInterval(intervalo);
}
