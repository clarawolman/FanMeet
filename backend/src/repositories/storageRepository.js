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
};
