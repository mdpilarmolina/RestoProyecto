import { body } from "express-validator";

// Mínimo 6 caracteres, al menos 2 números y al menos 2 letras
const PASSWORD_REGEX = /^(?=(?:.*\d){2,})(?=(?:.*\p{L}){2,}).{6,}$/u;

export const registerRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres"),
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("El formato del email no es válido"),
  body("password")
    .matches(PASSWORD_REGEX)
    .withMessage(
      "La contraseña debe tener al menos 6 caracteres, con 2 números y 2 letras como mínimo"
    ),
];

export const loginRules = [
  body("email").trim().toLowerCase().isEmail().withMessage("Ingresa un email válido"),
  body("password").notEmpty().withMessage("Ingresa tu contraseña"),
];