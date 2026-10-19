import { api } from "./api";

// Un bloqueo vale en los dos sentidos: ninguno ve al otro ni le puede
// escribir. Solo quien bloqueó lo puede deshacer (desde Configuración).
export const bloqueosService = {
  async listar() {
    return api.get("/bloqueos");
  },

  async bloquear(idUsuario) {
    return api.post("/bloqueos", { id_usuario: idUsuario });
  },

  async desbloquear(idUsuario) {
    return api.del(`/bloqueos/${idUsuario}`);
  },
};
