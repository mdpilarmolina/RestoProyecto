import { body, param, query } from "express-validator";
import { ORDER_STATUSES } from "../models/Order.js";

export const userIdRule = [param("id").isMongoId().withMessage("ID de usuario inválido")];

export const activeRule = [
  body("active").isBoolean().withMessage("'active' debe ser true o false").toBoolean(),
];

export const orderIdRule = [param("id").isMongoId().withMessage("ID de pedido inválido")];

// El administrador solo puede cerrar un pedido: entregarlo o cancelarlo
export const orderStatusRules = [
  ...orderIdRule,
  body("status").isIn(["Entregado", "Cancelado"]).withMessage("El estado debe ser 'Entregado' o 'Cancelado'"),
];

// Filtros del listado de pedidos: ?date=2026-11-20&table=7&status=Pedido realizado
export const orderFilterRules = [
  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha debe tener formato AAAA-MM-DD")
    .isISO8601({ strict: true })
    .withMessage("La fecha no es válida"),
  query("table").optional().isInt({ min: 1 }).withMessage("La mesa debe ser un entero mayor o igual a 1"),
  query("status").optional().isIn(ORDER_STATUSES).withMessage("Estado de pedido inválido"),
];

// Búsqueda de clientes: ?search=lucia
export const clientSearchRules = [
  query("search").optional().trim().isLength({ max: 100 }).withMessage("La búsqueda admite hasta 100 caracteres"),
];