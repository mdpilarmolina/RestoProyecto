import { body, param } from "express-validator";

export const userIdRule = [param("id").isMongoId().withMessage("ID de usuario inválido")];

export const activeRule = [
  body("active").isBoolean().withMessage("'active' debe ser true o false").toBoolean(),
];