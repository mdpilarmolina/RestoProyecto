import { Router } from "express";
import {
  checkAvailability,
  createReservation,
  listMyReservations,
  cancelReservation,
  checkinReservation,
} from "../controllers/reservation.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  availabilityRules,
  reservationRules,
  reservationIdRule,
  checkinRules,
} from "../middleware/reservationValidators.js";

const router = Router();

// Todas las rutas de reservas son solo para clientes logueados
router.use(authenticate, requireRole("client"));

router.get("/availability", availabilityRules, validate, checkAvailability);
router.get("/mine", listMyReservations);
router.post("/", reservationRules, validate, createReservation);
router.patch("/:id/cancel", reservationIdRule, validate, cancelReservation);
router.post("/:id/checkin", checkinRules, validate, checkinReservation);

export default router;