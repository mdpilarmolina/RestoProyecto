import { body, param, query } from "express-validator";
import { RESERVATION as R } from "../config/reservation.js";
import { RESTAURANT } from "../config/restaurant.js";

const ISO_MESSAGE = "La fecha debe tener formato ISO, por ejemplo 2026-11-20T21:00:00-03:00";
const TZ_MESSAGE = "La fecha debe incluir la zona horaria, por ejemplo -03:00";
const TZ_REGEX = /(Z|[+-]\d{2}:\d{2})$/; // termina en Z o en un desfasaje como -03:00
const DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PEOPLE_MESSAGE = `Las personas deben ser entre 1 y ${R.MAX_PEOPLE}`;

export const availabilityRules = [
  query("date").isISO8601({ strict: true }).withMessage(ISO_MESSAGE).matches(TZ_REGEX).withMessage(TZ_MESSAGE),
  query("people").isInt({ min: 1, max: R.MAX_PEOPLE }).withMessage(PEOPLE_MESSAGE),
];

export const slotsRules = [
  query("date")
    .matches(DAY_REGEX)
    .withMessage("La fecha debe tener formato AAAA-MM-DD")
    .isISO8601({ strict: true })
    .withMessage("La fecha no es válida"),
  query("people").isInt({ min: 1, max: R.MAX_PEOPLE }).withMessage(PEOPLE_MESSAGE),
];

export const reservationRules = [
  body("date").isISO8601({ strict: true }).withMessage(ISO_MESSAGE).matches(TZ_REGEX).withMessage(TZ_MESSAGE),
  body("people").isInt({ min: 1, max: R.MAX_PEOPLE }).withMessage(PEOPLE_MESSAGE).toInt(),
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
    .isInt({ min: 1, max: RESTAURANT.MAX_TABLES })
    .withMessage(`El número de mesa debe ser un entero entre 1 y ${RESTAURANT.MAX_TABLES}`)
    .toInt(),
];

export const adminStatusRules = [
  ...reservationIdRule,
  body("status").isIn(["cancelada", "no_asistio"]).withMessage("Estado inválido"),
];

export const adminListRules = [
  query("date").optional().isISO8601({ strict: true }).withMessage("La fecha debe ser AAAA-MM-DD"),
];