import { randomUUID } from "node:crypto";
import { storageRepository } from "../repositories/storageRepository.js";
import { esImagenValida } from "../helpers/validarImagen.js";
import { ApiError } from "../helpers/ApiError.js";

const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Chats privados y de grupo: un mensaje es texto, foto o las dos cosas.
// Valida eso antes de tocar la base; la foto se valida por sus bytes reales
// (no por la extensión ni el mimetype que declara el cliente).
export function validarTextoOFoto(texto, archivo) {
  if (!texto && !archivo) {
    throw ApiError.badRequest("El mensaje no puede estar vacío");
  }
  if (archivo && !esImagenValida(archivo)) {
    throw ApiError.badRequest("El archivo debe ser una imagen válida (jpg, png o webp)");
  }
}

// Sube la foto al bucket "chats" con un nombre aleatorio y devuelve su URL.
// `carpeta` separa los chats: el id del emisor (privados) o grupos/<id>.
export async function subirFotoDeChat(carpeta, archivo) {
  const ruta = `${carpeta}/${randomUUID()}.${EXTENSIONES[archivo.mimetype]}`;
  return storageRepository.subirArchivo("chats", ruta, archivo.buffer, archivo.mimetype);
}
