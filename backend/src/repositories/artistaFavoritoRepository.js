import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

// Tabla creada por supabase/spotify.sql.
export const artistaFavoritoRepository = {
  async listarPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("artista_favorito")
      .select("*")
      .eq("id_usuario", idUsuario)
      .order("created_at", { ascending: true });
    return unwrap(resultado, "Error cargando artistas favoritos");
  },

  async crear(idUsuario, artista) {
    const resultado = await supabaseAdmin
      .from("artista_favorito")
      .upsert(
        [
          {
            id_usuario: idUsuario,
            spotify_id: artista.spotify_id,
            nombre: artista.nombre,
            imagen: artista.imagen,
          },
        ],
        { onConflict: "id_usuario,spotify_id" }
      )
      .select()
      .single();
    return unwrap(resultado, "Error guardando artista favorito");
  },

  async eliminar(idUsuario, spotifyId) {
    const resultado = await supabaseAdmin
      .from("artista_favorito")
      .delete()
      .eq("id_usuario", idUsuario)
      .eq("spotify_id", spotifyId);
    return unwrap(resultado, "Error eliminando artista favorito");
  },
};
