import { Router } from "express";
import rateLimit from "express-rate-limit";
import { sendContact } from "../controllers/contact.controller.js";
import { validate } from "../middleware/validate.js";
import { contactRules } from "../middleware/contactValidators.js";

const router = Router();

// Máximo 5 consultas cada 15 minutos por IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Demasiados intentos. Prueba de nuevo en unos minutos." },
});

router.post("/", contactLimiter, contactRules, validate, sendContact);

export default router;