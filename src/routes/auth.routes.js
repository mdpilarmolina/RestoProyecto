import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, me } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerRules, loginRules } from "../middleware/authValidators.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20, // 20 intentos cada 15 minutos por IP
  message: { message: "Demasiados intentos. Prueba de nuevo en unos minutos." },
});

router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);
router.get("/me", authenticate, me);

export default router;