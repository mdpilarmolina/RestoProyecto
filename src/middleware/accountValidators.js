import { body } from "express-validator";
import { PASSWORD_REGEX } from "./authValidators.js";

export const nameRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres"),
];

export const emailRules = [
  body("email").trim().toLowerCase().isEmail().withMessage("El formato del email no es válido"),
  body("currentPassword").notEmpty().withMessage("Ingresa tu contraseña actual"),
];

export const passwordRules = [
  body("currentPassword").notEmpty().withMessage("Ingresa tu contraseña actual"),
  body("newPassword")
    .matches(PASSWORD_REGEX)
    .withMessage(
      "La contraseña debe tener al menos 6 caracteres, con 2 números y 2 letras como mínimo"
    )
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage("La nueva contraseña debe ser distinta de la actual"),
];