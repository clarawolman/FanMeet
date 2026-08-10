import { authService } from "../services/authService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const authController = {
  login: asyncHandler(async (req, res) => {
    const resultado = await authService.login(req.body);
    res.json(resultado);
  }),

  verificarDisponibilidad: asyncHandler(async (req, res) => {
    const resultado = await authService.verificarDisponibilidadRegistro(req.body);
    res.json(resultado);
  }),

  registro: asyncHandler(async (req, res) => {
    const resultado = await authService.registro(req.body);
    res.status(201).json(resultado);
  }),

  logout: asyncHandler(async (_req, res) => {
    await authService.logout();
    res.status(204).send();
  }),
};
