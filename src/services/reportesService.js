import { api } from "./api";

export const reportesService = {
  // idGrupo es opcional: si el problema fue en un grupo, el moderador ve
  // esa conversación; si no, ve el chat privado entre los dos.
  async reportar({ idReportado, idGrupo, motivo }) {
    return api.post("/reportes", { idReportado, idGrupo: idGrupo || null, motivo });
  },
};
