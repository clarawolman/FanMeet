import { supabaseAdmin } from "../config/supabaseClient.js";
import { ApiError } from "../helpers/ApiError.js";

export const storageRepository = {
  // Mismos buckets/convencion de nombre que usa hoy perfil.jsx:
  // `${id_usuario}/${timestamp}-${nombreArchivo}`.
  async subirArchivo(bucket, ruta, buffer, contentType) {
    const { error } = await supabaseAdmin.storage.from(bucket).upload(ruta, buffer, {
      contentType,
      upsert: false,
    });
    if (error) {
      throw ApiError.internal(`Error subiendo archivo a ${bucket}: ${error.message}`);
    }
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(ruta);
    return data.publicUrl;
  },

  // Recibe la URL pública que devolvió subirArchivo. Si falla solo queda
  // un archivo huérfano en el bucket: no se corta la operación por eso.
  async eliminarPorUrl(bucket, urlPublica) {
    const marca = `/object/public/${bucket}/`;
    const inicio = String(urlPublica || "").indexOf(marca);
    if (inicio === -1) return;
    const ruta = decodeURIComponent(urlPublica.slice(inicio + marca.length));
    const { error } = await supabaseAdmin.storage.from(bucket).remove([ruta]);
    if (error) console.error(`No se pudo borrar ${ruta} de ${bucket}:`, error.message);
  },
};
