import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/authRepository.js", () => ({
  authRepository: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    mailExisteEnAuth: vi.fn(),
    verificarCodigoRegistro: vi.fn(),
    reenviarCodigoRegistro: vi.fn(),
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

  it("avisa con 403 y details.codigo cuando el mail no está confirmado", async () => {
    authRepository.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: "email_not_confirmed", message: "Email not confirmed" },
    });

    await expect(
      authService.login({ usuarioOMail: "ana@mail.com", contrasena: "Abcdef1!" })
    ).rejects.toMatchObject({
      status: 403,
      details: { codigo: "mail_no_confirmado", mail: "ana@mail.com" },
    });
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
    expect(authRepository.signUp).toHaveBeenCalledWith(
      datosRegistro.mail,
      datosRegistro.contrasena,
      expect.objectContaining({ registro_pendiente: expect.any(Object) })
    );
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

  it("detecta el mail ya confirmado aunque Supabase no dé error (usuario sin identidades)", async () => {
    authRepository.signUp.mockResolvedValue({
      data: { user: { id: "falso", identities: [] }, session: null },
      error: null,
    });

    await expect(authService.registro(datosRegistro)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("ya tiene una cuenta"),
    });
  });
});

describe("authService: moderación", () => {
  it("un usuario suspendido no puede iniciar sesión", async () => {
    authRepository.signInWithPassword.mockResolvedValue({
      data: { user: { id: "u1" }, session: SESSION },
      error: null,
    });
    usuarioRepository.obtenerPorId.mockResolvedValue({ ...USUARIO_ROW, estado: "suspendido" });

    await expect(authService.login({ usuarioOMail: "ana@mail.com", contrasena: "x" })).rejects.toMatchObject({
      status: 403,
      details: { codigo: "CUENTA_SUSPENDIDA" },
    });
  });

  it("avisa que falta confirmar el mail", async () => {
    authRepository.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "email_not_confirmed", message: "Email not confirmed" },
    });

    await expect(authService.login({ usuarioOMail: "ana@mail.com", contrasena: "x" })).rejects.toMatchObject({
      status: 403,
      details: { codigo: "mail_no_confirmado" },
    });
  });
});

describe("authService.registro con confirmación de mail", () => {
  it("sin sesión no crea el perfil: la cuenta no existe para nadie hasta confirmar", async () => {
    authRepository.signUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [{}] }, session: null },
      error: null,
    });

    const resultado = await authService.registro({
      nombre: "Ana",
      mail: "ana@mail.com",
      contrasena: "Abcdef1!",
      fechanac: "2000-01-01",
      genero: "F",
      estilo_asistencia: "pogo",
      estilos_musicales: [],
    });

    expect(resultado.requiereConfirmacion).toBe(true);
    expect(resultado.session).toBeNull();
    expect(resultado.usuario).toBeNull();
    expect(usuarioRepository.crear).not.toHaveBeenCalled();
    expect(estiloMusicalRepository.reemplazarSeleccion).not.toHaveBeenCalled();
  });

  it("guarda los datos del perfil en Auth sin la contraseña", async () => {
    authRepository.signUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [{}] }, session: null },
      error: null,
    });

    await authService.registro({
      nombre: "Ana",
      mail: "ana@mail.com",
      contrasena: "Abcdef1!",
      fechanac: "2000-01-01",
      genero: "F",
      estilos_musicales: [1, 2],
    });

    const { registro_pendiente: pendiente } = authRepository.signUp.mock.calls[0][2];
    expect(pendiente).toMatchObject({ nombre: "Ana", estilos_musicales: [1, 2] });
    expect(pendiente).not.toHaveProperty("contrasena");
  });
});

describe("creación del perfil al confirmar el mail", () => {
  const USUARIO_PENDIENTE = {
    id: "abcd1234",
    user_metadata: {
      registro_pendiente: {
        nombre: "Ana",
        apodo: null,
        mail: "ana@mail.com",
        fechanac: "2000-01-01",
        genero: "F",
        fotoperfil: "default.png",
        estilo_asistencia: null,
        estilos_musicales: [1, 2],
      },
    },
  };

  beforeEach(() => {
    authRepository.verificarCodigoRegistro.mockResolvedValue({
      data: { user: USUARIO_PENDIENTE, session: SESSION },
      error: null,
    });
    usuarioRepository.obtenerPorId.mockResolvedValue(null);
    usuarioRepository.existeNombre.mockResolvedValue(null);
    usuarioRepository.crear.mockImplementation(async (fila) => fila);
  });

  it("crea el perfil y los géneros al verificar el código", async () => {
    const resultado = await authService.verificarCodigo({ mail: "ana@mail.com", codigo: "123456" });

    expect(usuarioRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ id_usuario: "abcd1234", nombre: "Ana", mail: "ana@mail.com" })
    );
    expect(usuarioRepository.crear.mock.calls[0][0]).not.toHaveProperty("estilos_musicales");
    expect(estiloMusicalRepository.reemplazarSeleccion).toHaveBeenCalledWith("abcd1234", [1, 2]);
    expect(resultado.usuario.id_usuario).toBe("abcd1234");
  });

  it("no lo duplica si el perfil ya existe", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue({ ...USUARIO_ROW, id_usuario: "abcd1234" });

    await authService.verificarCodigo({ mail: "ana@mail.com", codigo: "123456" });

    expect(usuarioRepository.crear).not.toHaveBeenCalled();
  });

  it("si otra persona tomó el nombre mientras tanto, igual crea el perfil con uno libre", async () => {
    usuarioRepository.existeNombre.mockResolvedValue({ id_usuario: "otro" });

    await authService.verificarCodigo({ mail: "ana@mail.com", codigo: "123456" });

    expect(usuarioRepository.crear).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Anaabcd" }));
  });

  it("crea el perfil al iniciar sesión si se confirmó con el link del mail", async () => {
    authRepository.signInWithPassword.mockResolvedValue({
      data: { user: USUARIO_PENDIENTE, session: SESSION },
      error: null,
    });

    const resultado = await authService.login({ usuarioOMail: "ana@mail.com", contrasena: "Abcdef1!" });

    expect(usuarioRepository.crear).toHaveBeenCalledTimes(1);
    expect(resultado.usuario.id_usuario).toBe("abcd1234");
  });
});

describe("authService.verificarCodigo", () => {
  it("devuelve usuario y sesión cuando el código es válido", async () => {
    authRepository.verificarCodigoRegistro.mockResolvedValue({
      data: { user: { id: "u1" }, session: SESSION },
      error: null,
    });
    usuarioRepository.obtenerPorId.mockResolvedValue(USUARIO_ROW);

    const resultado = await authService.verificarCodigo({ mail: " Ana@Mail.com ", codigo: "123456" });

    expect(authRepository.verificarCodigoRegistro).toHaveBeenCalledWith("ana@mail.com", "123456");
    expect(resultado.session).toEqual(SESSION);
    expect(resultado.usuario.id_usuario).toBe("u1");
  });

  it("rechaza con 400 si el código es incorrecto o venció", async () => {
    authRepository.verificarCodigoRegistro.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "otp_expired", message: "Token has expired or is invalid" },
    });

    await expect(
      authService.verificarCodigo({ mail: "ana@mail.com", codigo: "000000" })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("authService.reenviarCodigo", () => {
  it("responde 429 si Supabase limita el envío", async () => {
    authRepository.reenviarCodigoRegistro.mockResolvedValue({
      error: { status: 429, code: "over_email_send_rate_limit", message: "rate limit" },
    });

    await expect(authService.reenviarCodigo({ mail: "ana@mail.com" })).rejects.toMatchObject({
      status: 429,
    });
  });
});
