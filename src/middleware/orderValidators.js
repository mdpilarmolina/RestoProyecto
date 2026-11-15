import { body } from "express-validator";
import { RESTAURANT } from "../config/restaurant.js";

export const orderRules = [
  body("table")
    .isInt({ min: 1, max: RESTAURANT.MAX_TABLES })
    .withMessage(`El número de mesa debe ser un entero entre 1 y ${RESTAURANT.MAX_TABLES}`)
    .toInt(),
  body("notes").optional().trim().isLength({ max: 200 }).withMessage("Las aclaraciones admiten hasta 200 caracteres"),
  body("items").isArray({ min: 1 }).withMessage("El pedido debe tener al menos un producto"),
  body("items.*.productId").isMongoId().withMessage("Hay un producto con ID inválido"),
  body("items.*.quantity")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("La cantidad debe ser un entero entre 1 y 20")
    .toInt(),
];