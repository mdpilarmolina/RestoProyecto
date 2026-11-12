import { body, param } from "express-validator";

export const idRule = [param("id").isMongoId().withMessage("ID de producto inválido")];

export const productRules = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres"),
  body("image")
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("La imagen debe ser una URL válida (http o https)"),
  body("price").isFloat({ min: 0 }).withMessage("El precio debe ser un número mayor o igual a 0").toFloat(),
  body("description").trim().notEmpty().withMessage("La descripción es obligatoria"),
  body("available").optional().isBoolean().withMessage("'available' debe ser true o false").toBoolean(),
  body("ingredients").optional().isArray().withMessage("Los ingredientes deben ser una lista"),
  body("isVegetarian").optional().isBoolean().toBoolean(),
  body("isVegan").optional().isBoolean().toBoolean(),
  body("isGlutenFree").optional().isBoolean().toBoolean(),
];