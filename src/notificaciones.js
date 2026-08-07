import { supabase } from "./supabase";

export async function crearNotificacion({
  idUsuario,
  tipo,
  titulo,
  descripcion = null,
  imagen = null,
  idConcierto = null,
  idGrupo = null,
}) {
  const { error } = await supabase.from("notificacion").insert([
    {
      id_usuario: idUsuario,
      tipo,
      titulo,
      descripcion,
      imagen,
      id_concierto: idConcierto,
      id_grupo: idGrupo,
    },
  ]);

  if (error) {
    console.error("Error creando notificación:", error);
  }
}
