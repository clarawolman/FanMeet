import { Router } from "express";
import authRoutes from "./authRoutes.js";
import usuarioRoutes from "./usuarioRoutes.js";
import conciertoRoutes from "./conciertoRoutes.js";
import grupoRoutes from "./grupoRoutes.js";
import amistadRoutes from "./amistadRoutes.js";
import notificacionRoutes from "./notificacionRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/conciertos", conciertoRoutes);
router.use("/grupos", grupoRoutes);
router.use("/amistades", amistadRoutes);
router.use("/notificaciones", notificacionRoutes);

export default router;
