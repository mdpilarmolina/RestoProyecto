import { body } from "express-validator";

export const contactRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres"),
  body("email").trim().toLowerCase().isEmail().withMessage("El formato del email no es válido"),
  body("message")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("El mensaje debe tener entre 10 y 1000 caracteres"),
];