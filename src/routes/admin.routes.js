import { Router } from "express";
import {
  getStats,
  listOrders,
  listClients,
  listClientOrders,
  setClientActive,
  listReservations,
  setReservationStatus,
} from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  userIdRule,
  activeRule,
  orderFilterRules,
  clientSearchRules,
} from "../middleware/adminValidators.js";
import { adminListRules, adminStatusRules } from "../middleware/reservationValidators.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/stats", getStats);
router.get("/orders", orderFilterRules, validate, listOrders);
router.get("/clients", clientSearchRules, validate, listClients);
router.get("/clients/:id/orders", userIdRule, validate, listClientOrders);
router.patch("/clients/:id/active", userIdRule, activeRule, validate, setClientActive);
router.get("/reservations", adminListRules, validate, listReservations);
router.patch("/reservations/:id/status", adminStatusRules, validate, setReservationStatus);

export default router;