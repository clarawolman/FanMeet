import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/authRepository.js", () => ({
  authRepository: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    mailExisteEnAuth: vi.fn(),
  },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: {
    obtenerMailPorNombre: vi.fn(),
    obtenerPorId: vi.fn(),
    existeMail: vi.fn(),
    existeNombre: vi.fn(),
    crear: vi.fn(),
  },
}));

vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: {
    reemplazarSeleccion: vi.fn(),
  },
}));

const { authRepository } = await import("../src/repositories/authRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { authService } = await import("../src/services/authService.js");

const SESSION = { access_token: "at", refresh_token: "rt", expires_at: 123 };
const USUARIO_ROW = { id_usuario: "u1", nombre: "Ana", mail: "ana@mail.com" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authService.login", () => {
  it("resuelve el mail por nombre de usuario cuando no viene un '@'", async () => {
    usuarioRepository.obtenerMailPorNombre.mockResolvedValue({ mail: "ana@mail.com" });
    authRepository.signInWithPassword.mockResolvedValue({
      data: { user: { id: "u1" }, session: SESSION },
      error: null,
    });
    usuarioRepository.obtenerPorId.mockResolvedValue(USUARIO_ROW);

    const resultado = await authService.login({ usuarioOMail: "ana", contrasena: "Abcdef1!" });

    expect(usuarioRepository.obtenerMailPorNombre).toHaveBeenCalledWith("ana");
    expect(authRepository.signInWithPassword).toHaveBeenCalledWith("ana@mail.com", "Abcdef1!");
    expect(resultado.usuario.id_usuario).toBe("u1");
    expect(resultado.session).toEqual(SESSION);
  });

  it("rechaza con 'Este usuario no existe' si el nombre de usuario no resuelve a un mail", async () => {
    usuarioRepository.obtenerMailPorNombre.mockResolvedValue(null);

    await expect(
      authService.login({ usuarioOMail: "fantasma", contrasena: "x" })
    ).rejects.toMatchObject({ status: 401, message: "Este usuario no existe" });

    expect(authRepository.signInWithPassword).not.toHaveBeenCalled();
  });

  it("rechaza con 401 genérico si signInWithPassword falla (no filtra la causa)", async () => {
    authRepository.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    await expect(
      authService.login({ usuarioOMail: "ana@mail.com", contrasena: "mala" })
    ).rejects.toMatchObject({ status: 401, message: "Usuario/mail o contraseña incorrectos" });
  });

  it("rechaza si el auth existe pero no hay fila en la tabla usuario", async () => {
    authRepository.signInWithPassword.mockResolvedValue({
      data: { user: { id: "u1" }, session: SESSION },
      error: null,
    });
    usuarioRepository.obtenerPorId.mockResolvedValue(null);

    await expect(
      authService.login({ usuarioOMail: "ana@mail.com", contrasena: "Abcdef1!" })
    ).rejects.toMatchObject({ status: 401, message: "Este usuario no existe" });
  });
});

describe("authService.verificarDisponibilidadRegistro", () => {
  it("replica el mensaje 'Mail ya está registrado' cuando ya existe en la tabla usuario", async () => {
    usuarioRepository.existeMail.mockResolvedValue({ id_usuario: "otro" });

    const resultado = await authService.verificarDisponibilidadRegistro({
      nombre: "Ana",
      mail: "ana@mail.com",
    });

    expect(resultado).toEqual({ disponible: false, mensaje: "Mail ya está registrado" });
    expect(authRepository.mailExisteEnAuth).not.toHaveBeenCalled();
  });

  it("replica el mensaje 'E-mail ya registrado.' cuando la RPC dice que ya existe en Auth", async () => {
    usuarioRepository.existeMail.mockResolvedValue(null);
    authRepository.mailExisteEnAuth.mockResolvedValue({ data: true, error: null });

    const resultado = await authService.verificarDisponibilidadRegistro({
      nombre: "Ana",
      mail: "ana@mail.com",
    });

    expect(resultado).toEqual({ disponible: false, mensaje: "E-mail ya registrado." });
    expect(usuarioRepository.existeNombre).not.toHaveBeenCalled();
  });

  it("replica el mensaje 'Nombre de usuario en uso' cuando el nombre ya existe", async () => {
    usuarioRepository.existeMail.mockResolvedValue(null);
    authRepository.mailExisteEnAuth.mockResolvedValue({ data: false, error: null });
    usuarioRepository.existeNombre.mockResolvedValue({ id_usuario: "otro" });

    const resultado = await authService.verificarDisponibilidadRegistro({
      nombre: "Ana",
      mail: "ana@mail.com",
    });

    expect(resultado).toEqual({ disponible: false, mensaje: "Nombre de usuario en uso" });
  });

  it("devuelve disponible:true cuando pasa los 3 chequeos", async () => {
    usuarioRepository.existeMail.mockResolvedValue(null);
    authRepository.mailExisteEnAuth.mockResolvedValue({ data: false, error: null });
    usuarioRepository.existeNombre.mockResolvedValue(null);

    const resultado = await authService.verificarDisponibilidadRegistro({
      nombre: "Ana",
      mail: "ana@mail.com",
    });

    expect(resultado).toEqual({ disponible: true });
  });
});

describe("authService.registro", () => {
  const datosRegistro = {
    nombre: "Ana",
    mail: "ana@mail.com",
    contrasena: "Abcdef1!",
    fechanac: "2000-01-01",
    genero: "F",
    estilo_asistencia: "pogo",
    estilos_musicales: [1, 2],
  };

  it("no precachea duplicados: llama a signUp directo, igual que App.jsx hoy", async () => {
    authRepository.signUp.mockResolvedValue({
      data: { user: { id: "u1" }, session: SESSION },
      error: null,
    });
    usuarioRepository.crear.mockResolvedValue({ ...USUARIO_ROW, id_usuario: "u1" });

    await authService.registro(datosRegistro);

    expect(usuarioRepository.existeMail).not.toHaveBeenCalled();
    expect(usuarioRepository.existeNombre).not.toHaveBeenCalled();
    expect(authRepository.signUp).toHaveBeenCalledWith(datosRegistro.mail, datosRegistro.contrasena);
  });

  it("crea el usuario y guarda sus géneros cuando todo es válido", async () => {
    authRepository.signUp.mockResolvedValue({
      data: { user: { id: "u1" }, session: SESSION },
      error: null,
    });
    usuarioRepository.crear.mockResolvedValue({ ...USUARIO_ROW, id_usuario: "u1" });

    const resultado = await authService.registro(datosRegistro);

    expect(usuarioRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ id_usuario: "u1", mail: "ana@mail.com" })
    );
    expect(estiloMusicalRepository.reemplazarSeleccion).toHaveBeenCalledWith("u1", [1, 2]);
    expect(resultado.usuario.id_usuario).toBe("u1");
  });

  it("da un mensaje accionable si signUp falla por mail ya registrado en Auth", async () => {
    authRepository.signUp.mockResolvedValue({
      data: null,
      error: { code: "user_already_exists", message: "User already registered" },
    });

    await expect(authService.registro(datosRegistro)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("ya tiene una cuenta"),
    });
    expect(usuarioRepository.crear).not.toHaveBeenCalled();
  });
});
