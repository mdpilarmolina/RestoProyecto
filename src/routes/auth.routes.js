import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerRules, loginRules } from "../middleware/authValidators.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", authenticate, me);

// Ruta TEMPORAL solo para probar roles; la borraremos cuando existan rutas reales de admin
router.get("/admin-check", authenticate, requireRole("admin"), (req, res) => {
  res.json({ ok: true, message: "Hola, administrador" });
});

export default router;