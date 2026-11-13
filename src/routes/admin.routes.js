import { Router } from "express";
import {
  getStats,
  listOrders,
  listClients,
  listClientOrders,
  setClientActive,
} from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { userIdRule, activeRule } from "../middleware/adminValidators.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/stats", getStats);
router.get("/orders", listOrders);
router.get("/clients", listClients);
router.get("/clients/:id/orders", userIdRule, validate, listClientOrders);
router.patch("/clients/:id/active", userIdRule, activeRule, validate, setClientActive);

export default router;