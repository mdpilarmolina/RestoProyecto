import { body, param, query } from "express-validator";

const ISO_MESSAGE = "La fecha debe tener formato ISO, por ejemplo 2026-11-20T21:00:00-03:00";

export const availabilityRules = [
  query("date").isISO8601({ strict: true }).withMessage(ISO_MESSAGE),
  query("people").isInt({ min: 1, max: 12 }).withMessage("Las personas deben ser entre 1 y 12"),
];

export const reservationRules = [
  body("date").isISO8601({ strict: true }).withMessage(ISO_MESSAGE),
  body("people").isInt({ min: 1, max: 12 }).withMessage("Las personas deben ser entre 1 y 12").toInt(),
  body("notes").optional().trim().isLength({ max: 300 }).withMessage("Las notas admiten hasta 300 caracteres"),
  body("items").optional().isArray().withMessage("Los platos deben ser una lista"),
  body("items.*.productId").isMongoId().withMessage("Hay un producto con ID inválido"),
  body("items.*.quantity")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("La cantidad debe ser un entero entre 1 y 20")
    .toInt(),
];

export const reservationIdRule = [param("id").isMongoId().withMessage("ID de reserva inválido")];

export const checkinRules = [
  ...reservationIdRule,
  body("table")
    .isInt({ min: 1 })
    .withMessage("El número de mesa debe ser un entero mayor o igual a 1")
    .toInt(),
];

export const adminStatusRules = [
  ...reservationIdRule,
  body("status").isIn(["cancelada", "no_asistio"]).withMessage("Estado inválido"),
];

export const adminListRules = [
  query("date").optional().isISO8601({ strict: true }).withMessage("La fecha debe ser AAAA-MM-DD"),
];