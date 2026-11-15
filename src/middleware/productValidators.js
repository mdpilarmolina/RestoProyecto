import { body, param, query } from "express-validator";
import { CATEGORIES } from "../models/Product.js";

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
  body("category")
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`La categoría debe ser una de: ${CATEGORIES.join(", ")}`),
  body("sortOrder").optional().isInt({ min: 0 }).withMessage("El orden debe ser un entero mayor o igual a 0").toInt(),
  body("ingredients").optional().isArray().withMessage("Los ingredientes deben ser una lista"),
  body("isVegetarian").optional().isBoolean().toBoolean(),
  body("isVegan").optional().isBoolean().toBoolean(),
  body("isGlutenFree").optional().isBoolean().toBoolean(),
];

// Cambiar solo la disponibilidad: PATCH /api/products/:id/availability con { "available": false }
export const productAvailabilityRule = [
  body("available")
    .isBoolean({ strict: true })
    .withMessage("'available' es obligatorio y debe ser true o false"),
];

// Filtros de la carta: ?category=postres&vegan=true&glutenFree=true&search=queso
export const productFilterRules = [
  query("category")
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`La categoría debe ser una de: ${CATEGORIES.join(", ")}`),
  query("vegetarian").optional().isIn(["true", "false"]).withMessage("'vegetarian' debe ser true o false"),
  query("vegan").optional().isIn(["true", "false"]).withMessage("'vegan' debe ser true o false"),
  query("glutenFree").optional().isIn(["true", "false"]).withMessage("'glutenFree' debe ser true o false"),
  query("search").optional().isLength({ max: 100 }).withMessage("La búsqueda admite hasta 100 caracteres"),
];