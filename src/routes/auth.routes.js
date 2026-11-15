import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { register, login, me } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerRules, loginRules } from "../middleware/authValidators.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const WINDOW_MS = 15 * 60 * 1000;
const message = { message: "Demasiados intentos. Prueba de nuevo en unos minutos." };

// Solo cuentan los intentos FALLIDOS (respuestas 4xx): un cliente que entra bien no gasta cupo.
// 1) Por IP + email: frena a quien prueba contraseñas contra una misma cuenta.
const perIpAndEmail = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}|${String(req.body?.email ?? "").toLowerCase().slice(0, 100)}`,
  message,
});

// 2) Solo por IP, con un tope alto: en el local todos comparten el wifi, así que no puede ser bajo.
const perIp = rateLimit({
  windowMs: WINDOW_MS,
  limit: 100,
  skipSuccessfulRequests: true,
  message,
});

router.post("/register", perIp, perIpAndEmail, registerRules, validate, register);
router.post("/login", perIp, perIpAndEmail, loginRules, validate, login);
router.get("/me", authenticate, me);

export default router;