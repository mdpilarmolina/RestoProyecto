import { body } from "express-validator";

export const orderRules = [
  body("table")
    .isInt({ min: 1 })
    .withMessage("El número de mesa debe ser un entero mayor o igual a 1")
    .toInt(),
  body("items").isArray({ min: 1 }).withMessage("El pedido debe tener al menos un producto"),
  body("items.*.productId").isMongoId().withMessage("Hay un producto con ID inválido"),
  body("items.*.quantity")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("La cantidad debe ser un entero entre 1 y 20")
    .toInt(),
];