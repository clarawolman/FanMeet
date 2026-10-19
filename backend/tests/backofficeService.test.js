import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/backofficeRepository.js", () => ({
  backofficeRepository: {
    crearNotificaciones: vi.fn(),
    actualizarConcierto: vi.fn(),
    obtenerOCrearArtista: vi.fn(),
    crearConcierto: vi.fn(),
    eliminarConcierto: vi.fn(),
    eliminarGrupos: vi.fn(),
    listarEstadios: vi.fn(),
    listarConciertos: vi.fn(),
    cambiarEstadoUsuario: vi.fn(),
    banearEnAuth: vi.fn(),
  },
}));
vi.mock("../src/repositories/reporteRepository.js", () => ({
  reporteRepository: { obtenerPorId: vi.fn(), resolver: vi.fn(), listarDeUsuario: vi.fn() },
}));
vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { obtenerPorId: vi.fn(), listarPorIds: vi.fn(async () => []) },
}));
vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: { obtenerPorId: vi.fn() },
  usuariosConciertosRepository: { listarUsuariosPorConcierto: vi.fn() },
}));
vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: {
    listarPorIds: vi.fn(async () => []),
    listarPorConcierto: vi.fn(async () => []),
    obtenerPorId: vi.fn(),
    actualizar: vi.fn(),
  },
  grupoUsuarioRepository: { listarUsuariosPorGrupo: vi.fn() },
}));
vi.mock("../src/repositories/storageRepository.js", () => ({
  storageRepository: { eliminarCarpeta: vi.fn(async () => 0) },
}));
vi.mock("../src/repositories/mensajeRepository.js", () => ({ mensajeRepository: {} }));
vi.mock("../src/repositories/mensajePrivadoRepository.js", () => ({ mensajePrivadoRepository: {} }));
vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: { listarCatalogo: vi.fn() },
}));
vi.mock("../src/helpers/imagenRemota.js", () => ({ problemaConImagen: vi.fn(async () => null) }));
vi.mock("../src/services/avisoCambiosGrupo.js", () => ({
  avisarCambiosDeGrupo: vi.fn(async () => 3),
}));
vi.mock("../src/repositories/artistaFavoritoRepository.js", () => ({
  artistaFavoritoRepository: { listarTodos: vi.fn(), listarPorSpotifyId: vi.fn() },
}));

const { backofficeRepository } = await import("../src/repositories/backofficeRepository.js");
const { reporteRepository } = await import("../src/repositories/reporteRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { storageRepository } = await import("../src/repositories/storageRepository.js");
const { artistaFavoritoRepository } = await import("../src/repositories/artistaFavoritoRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { problemaConImagen } = await import("../src/helpers/imagenRemota.js");
const { backofficeService } = await import("../src/services/backofficeService.js");
const { env } = await import("../src/config/env.js");

const CONCIERTO = { id_concierto: 4, nombre: "Short N Sweet Tour", fecha: "2026-08-28T21:00:00" };

function unidos(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({ id_usuario: `u${i}`, id_concierto: 4 }));
}

beforeEach(() => {
  vi.clearAllMocks();
  conciertoRepository.obtenerPorId.mockResolvedValue(CONCIERTO);
  backofficeRepository.actualizarConcierto.mockImplementation(async (_id, cambios) => ({
    ...CONCIERTO,
    ...cambios,
  }));
});

describe("backofficeService.actualizarConcierto", () => {
  it("avisa a todos los unidos si son al menos el mínimo", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(
      unidos(env.minimoUnidosParaNotificar)
    );

    const { aviso } = await backofficeService.actualizarConcierto(4, { fecha: "2026-08-29T21:00" });

    expect(aviso.notificados).toBe(env.minimoUnidosParaNotificar);
    const filas = backofficeRepository.crearNotificaciones.mock.calls[0][0];
    expect(filas).toHaveLength(env.minimoUnidosParaNotificar);
    expect(filas[0]).toMatchObject({ tipo: "novedad_concierto", id_concierto: 4 });
    expect(filas[0].descripcion).toContain("la fecha y hora");
  });

  it("no avisa si hay pocos unidos", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(unidos(2));

    const { aviso } = await backofficeService.actualizarConcierto(4, { fecha: "2026-08-29T21:00" });

    expect(aviso.notificados).toBe(0);
    expect(backofficeRepository.crearNotificaciones).not.toHaveBeenCalled();
  });

  it("no avisa si en realidad no cambió nada", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(unidos(50));

    await backofficeService.actualizarConcierto(4, { nombre: CONCIERTO.nombre });

    expect(backofficeRepository.crearNotificaciones).not.toHaveBeenCalled();
  });
});

describe("backofficeService.crearConcierto", () => {
  beforeEach(() => {
    backofficeRepository.obtenerOCrearArtista.mockResolvedValue({ id_artista: 7, nombre: "Tini" });
    backofficeRepository.crearConcierto.mockImplementation(async (datos) => ({ ...CONCIERTO, ...datos }));
  });

  it("avisa una vez a cada usuario que sigue al artista, sin importar mayúsculas ni tildes", async () => {
    artistaFavoritoRepository.listarTodos.mockResolvedValue([
      { id_usuario: "u1", spotify_id: "a", nombre: "TINI" },
      { id_usuario: "u2", spotify_id: "a", nombre: "Tiní" },
      { id_usuario: "u2", spotify_id: "b", nombre: "tini" },
      { id_usuario: "u3", spotify_id: "c", nombre: "Lali" },
    ]);

    const concierto = await backofficeService.crearConcierto({ artista: "Tini", nombre: "Futttura" });

    expect(concierto.id_artista).toBe(7);
    const filas = backofficeRepository.crearNotificaciones.mock.calls[0][0];
    expect(filas.map((f) => f.id_usuario)).toEqual(["u1", "u2"]);
    expect(filas[0]).toMatchObject({ tipo: "novedad_concierto", id_concierto: CONCIERTO.id_concierto });
  });

  it("si el artista está vinculado a Spotify, busca a los seguidores por id", async () => {
    backofficeRepository.obtenerOCrearArtista.mockResolvedValue({
      id_artista: 8,
      nombre: "Duki",
      spotify_id: "1bAftSH8umNcGZ0uyV7LMg",
    });
    artistaFavoritoRepository.listarPorSpotifyId.mockResolvedValue([{ id_usuario: "u9" }]);

    await backofficeService.crearConcierto({
      artista: "Duki",
      artista_spotify_id: "1bAftSH8umNcGZ0uyV7LMg",
      nombre: "Ameri Tour",
    });

    expect(backofficeRepository.obtenerOCrearArtista).toHaveBeenCalledWith("Duki", "1bAftSH8umNcGZ0uyV7LMg");
    // El id de Spotify va en la tabla artista, no en concierto.
    expect(backofficeRepository.crearConcierto.mock.calls[0][0]).not.toHaveProperty("artista_spotify_id");
    expect(artistaFavoritoRepository.listarPorSpotifyId).toHaveBeenCalledWith("1bAftSH8umNcGZ0uyV7LMg");
    expect(artistaFavoritoRepository.listarTodos).not.toHaveBeenCalled();
    expect(backofficeRepository.crearNotificaciones.mock.calls[0][0].map((n) => n.id_usuario)).toEqual(["u9"]);
  });

  it("si falla el aviso, el concierto igual se crea", async () => {
    artistaFavoritoRepository.listarTodos.mockRejectedValue(new Error("se cayó la base"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const concierto = await backofficeService.crearConcierto({ artista: "Tini", nombre: "Futttura" });

    expect(concierto.id_artista).toBe(7);
  });
});

describe("importación de conciertos en lote", () => {
  const IMG = "https://cdn.test/show.jpg";
  const ENCABEZADO = "Nombre\tArtista\tEstadio\tGénero\tFecha y hora\tImagen";
  const fila = (...celdas) => celdas.join("\t");
  const lista = (...filas) => [ENCABEZADO, ...filas].join("\n");

  beforeEach(() => {
    backofficeRepository.listarEstadios.mockResolvedValue([
      { id_estadio: 1, nombre: "Movistar Arena" },
      { id_estadio: 2, nombre: "River Plate" },
    ]);
    estiloMusicalRepository.listarCatalogo.mockResolvedValue([
      { id_estiloMusical: 10, nombre: "Rock" },
      { id_estiloMusical: 11, nombre: "singer-songwriter" },
    ]);
    backofficeRepository.listarConciertos.mockResolvedValue([
      { id_concierto: 1, nombre: "Take Cover Tour", fecha: "2099-02-25T21:00:00" },
    ]);
    backofficeRepository.obtenerOCrearArtista.mockImplementation(async (nombre) => ({ id_artista: 7, nombre }));
    let id = 100;
    backofficeRepository.crearConcierto.mockImplementation(async (datos) => ({ id_concierto: id++, ...datos }));
    artistaFavoritoRepository.listarTodos.mockResolvedValue([{ id_usuario: "u1", nombre: "Rush" }]);
  });

  it("la vista previa marca cada error en su fila y no crea nada", async () => {
    problemaConImagen.mockImplementation(async (url) => (url.includes("rota") ? "La imagen no carga" : null));

    const { filas } = await backofficeService.previaImportacion(
      lista(
        fila("Fifty Something", "Rush", "movistar arena", "rock", "15/01/2099 21:00", IMG),
        fila("Show X", "Jungle", "Teatro Colón", "Indie", "15/01/2099 21:00", IMG),
        fila("Viejo", "Rush", "River Plate", "rock", "15/01/2020 21:00", IMG),
        fila("Sin foto", "Rush", "River Plate", "rock", "16/01/2099 21:00", "https://cdn.test/rota.jpg"),
        fila("Take Cover Tour", "Foo Fighters", "River Plate", "rock", "25/02/2099 22:00", IMG),
        fila("fifty something", "Rush", "River Plate", "rock", "15/01/2099 23:00", IMG),
        fila("Sin hora", "Rush", "River Plate", "rock", "20/01/2099", "imagen.jpg")
      )
    );

    expect(filas.map((f) => f.errores)).toEqual([
      [],
      ['No existe el estadio "Teatro Colón"', 'No existe el género "Indie"'],
      ["La fecha ya pasó"],
      ["La imagen no carga"],
      ["Ya existe un concierto con ese nombre ese día"],
      ["Repetido: es igual a la fila 1"],
      ["Falta la hora", "La imagen tiene que ser una URL (https://...)"],
    ]);
    // Muestra el nombre como está en la base y la fecha ya interpretada.
    expect(filas[0]).toMatchObject({ estadio: "Movistar Arena", genero: "Rock", fecha: "2099-01-15T21:00" });
    expect(filas[0]).not.toHaveProperty("datos");
    // La misma URL se prueba una sola vez.
    expect(problemaConImagen).toHaveBeenCalledTimes(2);
    expect(backofficeRepository.crearConcierto).not.toHaveBeenCalled();
  });

  it("crea solo las filas válidas y avisa a los seguidores de cada artista", async () => {
    const resultado = await backofficeService.importarConciertos(
      lista(
        fila("Fifty Something", "Rush", "Movistar Arena", "rock", "15/01/2099 21:00", IMG),
        fila("Show X", "Jungle", "Teatro Colón", "rock", "15/01/2099 21:00", IMG),
        fila("Lives Outgrown", "Beth Gibbons", "River Plate", "Singer Songwriter", "27/05/2099 21:00", IMG)
      )
    );

    expect(backofficeRepository.crearConcierto.mock.calls.map((c) => c[0])).toEqual([
      { nombre: "Fifty Something", id_estadio: 1, id_estiloMusical: 10, fecha: "2099-01-15T21:00", imagenConcierto: IMG, id_artista: 7 },
      { nombre: "Lives Outgrown", id_estadio: 2, id_estiloMusical: 11, fecha: "2099-05-27T21:00", imagenConcierto: IMG, id_artista: 7 },
    ]);
    expect(backofficeRepository.obtenerOCrearArtista).toHaveBeenCalledWith("Rush", null);
    expect(resultado.creados).toEqual([
      { fila: 1, id_concierto: 100, nombre: "Fifty Something" },
      { fila: 3, id_concierto: 101, nombre: "Lives Outgrown" },
    ]);
    expect(resultado.conErrores.map((f) => f.fila)).toEqual([2]);
    expect(resultado.fallidos).toEqual([]);
    expect(resultado.notificados).toBe(1);
  });

  it("si falla una fila al crearla, sigue con las demás", async () => {
    backofficeRepository.crearConcierto
      .mockRejectedValueOnce(new Error("Error creando el concierto"))
      .mockImplementationOnce(async (datos) => ({ id_concierto: 200, ...datos }));

    const resultado = await backofficeService.importarConciertos(
      lista(
        fila("Uno", "Rush", "Movistar Arena", "rock", "15/01/2099 21:00", IMG),
        fila("Dos", "Rush", "Movistar Arena", "rock", "16/01/2099 21:00", IMG)
      )
    );

    expect(resultado.fallidos).toEqual([{ fila: 1, nombre: "Uno", error: "Error creando el concierto" }]);
    expect(resultado.creados).toEqual([{ fila: 2, id_concierto: 200, nombre: "Dos" }]);
  });

  it("responde 400 si no hay filas", async () => {
    await expect(backofficeService.previaImportacion(ENCABEZADO)).rejects.toMatchObject({ status: 400 });
  });
});

describe("backofficeService.eliminarConcierto", () => {
  it("borra el concierto y avisa a todos los unidos, sin link al concierto", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(unidos(2));

    const resultado = await backofficeService.eliminarConcierto(4);

    expect(backofficeRepository.eliminarConcierto).toHaveBeenCalledWith(4);
    const filas = backofficeRepository.crearNotificaciones.mock.calls[0][0];
    expect(filas.map((f) => f.id_usuario)).toEqual(["u0", "u1"]);
    expect(filas[0].titulo).toMatch(/Se canceló/);
    expect(filas[0]).not.toHaveProperty("id_concierto");
    expect(resultado).toEqual({ ok: true, notificados: 2 });
  });

  it("responde 404 si el concierto no existe", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(backofficeService.eliminarConcierto(99)).rejects.toMatchObject({ status: 404 });
    expect(backofficeRepository.eliminarConcierto).not.toHaveBeenCalled();
  });

  it("borra también las fotos de los chats de sus grupos", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue([]);
    grupoRepository.listarPorConcierto.mockResolvedValue([{ id_grupo: 5 }, { id_grupo: 6 }]);

    await backofficeService.eliminarConcierto(4);

    expect(storageRepository.eliminarCarpeta.mock.calls).toEqual([
      ["chats", "grupos/5"],
      ["chats", "grupos/6"],
    ]);
  });
});

describe("backofficeService.eliminarGrupo", () => {
  const GRUPO = { id_grupo: 9, nombre: "Previa en Palermo", foto: "https://cdn/grupo.png" };

  beforeEach(() => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([
      { id_usuario: "u0" },
      { id_usuario: "u1" },
    ]);
  });

  it("borra el grupo y sus fotos, y avisa a los integrantes sin link al grupo", async () => {
    const resultado = await backofficeService.eliminarGrupo(9);

    expect(backofficeRepository.eliminarGrupos).toHaveBeenCalledWith([9]);
    expect(storageRepository.eliminarCarpeta).toHaveBeenCalledWith("chats", "grupos/9");
    const filas = backofficeRepository.crearNotificaciones.mock.calls[0][0];
    expect(filas.map((f) => f.id_usuario)).toEqual(["u0", "u1"]);
    expect(filas[0]).toMatchObject({ tipo: "cambio_grupo", imagen: GRUPO.foto });
    expect(filas[0].titulo).toMatch(/Se eliminó el grupo Previa en Palermo/);
    expect(filas[0]).not.toHaveProperty("id_grupo");
    expect(resultado).toEqual({ ok: true, notificados: 2 });
  });

  it("si falla el borrado de las fotos, el grupo se elimina igual", async () => {
    storageRepository.eliminarCarpeta.mockRejectedValueOnce(new Error("Storage caído"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    const resultado = await backofficeService.eliminarGrupo(9);

    expect(backofficeRepository.eliminarGrupos).toHaveBeenCalled();
    expect(resultado.notificados).toBe(2);
  });

  it("responde 404 si el grupo no existe", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(backofficeService.eliminarGrupo(99)).rejects.toMatchObject({ status: 404 });
    expect(backofficeRepository.eliminarGrupos).not.toHaveBeenCalled();
    expect(storageRepository.eliminarCarpeta).not.toHaveBeenCalled();
  });
});

describe("backofficeService.resolverReporte", () => {
  const REPORTE = { id_reporte: 7, id_reportante: "a", id_reportado: "b", estado: "pendiente", motivo: "insultos" };

  beforeEach(() => {
    reporteRepository.obtenerPorId.mockResolvedValue(REPORTE);
    reporteRepository.resolver.mockImplementation(async (_id, { estado }) => ({ ...REPORTE, estado }));
    usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: "b", rol: "usuario" });
    backofficeRepository.cambiarEstadoUsuario.mockResolvedValue({ id_usuario: "b", estado: "suspendido" });
  });

  it("sancionar suspende al usuario reportado", async () => {
    const resultado = await backofficeService.resolverReporte("mod", 7, { decision: "sancionar" });

    expect(backofficeRepository.cambiarEstadoUsuario).toHaveBeenCalledWith("b", {
      estado: "suspendido",
      motivo: "insultos",
    });
    expect(backofficeRepository.banearEnAuth).toHaveBeenCalledWith("b", true);
    expect(resultado.estado).toBe("sancionado");
  });

  it("descartar no toca al usuario", async () => {
    const resultado = await backofficeService.resolverReporte("mod", 7, { decision: "descartar" });

    expect(backofficeRepository.cambiarEstadoUsuario).not.toHaveBeenCalled();
    expect(resultado.estado).toBe("descartado");
  });

  it("un moderador no se puede suspender a sí mismo", async () => {
    await expect(
      backofficeService.cambiarEstadoUsuario("b", "b", { estado: "suspendido", motivo: "x" })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("backofficeService.actualizarGrupo", () => {
  beforeEach(() => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 9, nombre: "Previa", foto: "https://x.com/a.jpg" });
    grupoRepository.actualizar.mockImplementation(async (id, cambios) => ({ id_grupo: id, ...cambios }));
  });

  it("guarda solo los campos que llegan y avisa a los integrantes", async () => {
    const resultado = await backofficeService.actualizarGrupo(9, { nombre: "Previa nueva", hora: "19:00" });
    expect(grupoRepository.actualizar).toHaveBeenCalledWith(9, { nombre: "Previa nueva", hora: "19:00" });
    expect(resultado).toMatchObject({ grupo: { id_grupo: 9, nombre: "Previa nueva" }, notificados: 3 });
  });

  it("foto vacía le saca la foto al grupo", async () => {
    await backofficeService.actualizarGrupo(9, { foto: "" });
    expect(grupoRepository.actualizar).toHaveBeenCalledWith(9, { foto: null });
  });

  it("si el grupo no existe responde 404", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(null);
    await expect(backofficeService.actualizarGrupo(9, { nombre: "X" })).rejects.toMatchObject({ status: 404 });
    expect(grupoRepository.actualizar).not.toHaveBeenCalled();
  });

  it("si lo pasan a un concierto que no existe responde 404", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(null);
    await expect(backofficeService.actualizarGrupo(9, { id_concierto: 99 })).rejects.toMatchObject({ status: 404 });
    expect(grupoRepository.actualizar).not.toHaveBeenCalled();
  });
});
