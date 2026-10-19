import { Router } from "express";
import authRoutes from "./authRoutes.js";
import usuarioRoutes from "./usuarioRoutes.js";
import conciertoRoutes from "./conciertoRoutes.js";
import grupoRoutes from "./grupoRoutes.js";
import mensajeRoutes from "./mensajeRoutes.js";
import amistadRoutes from "./amistadRoutes.js";
import notificacionRoutes from "./notificacionRoutes.js";
import chatRoutes from "./chatRoutes.js";
import spotifyRoutes from "./spotifyRoutes.js";
import lastfmRoutes from "./lastfmRoutes.js";
import matchingRoutes from "./matchingRoutes.js";
import chatbotRoutes from "./chatbotRoutes.js";
import reporteRoutes from "./reporteRoutes.js";
import backofficeRoutes from "./backofficeRoutes.js";
import momentoRoutes from "./momentoRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/conciertos", conciertoRoutes);
router.use("/grupos", grupoRoutes);
router.use("/grupos", mensajeRoutes);
router.use("/amistades", amistadRoutes);
router.use("/notificaciones", notificacionRoutes);
router.use("/chats", chatRoutes);
router.use("/spotify", spotifyRoutes);
router.use("/lastfm", lastfmRoutes);
router.use("/matching", matchingRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/reportes", reporteRoutes);
router.use("/backoffice", backofficeRoutes);
router.use("/momentos", momentoRoutes);

export default router;
