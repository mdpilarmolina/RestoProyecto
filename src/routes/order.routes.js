import { Router } from "express";
import { createOrder, listMyOrders } from "../controllers/order.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { orderRules } from "../middleware/orderValidators.js";

const router = Router();

router.post("/", authenticate, requireRole("client"), orderRules, validate, createOrder);
router.get("/mine", authenticate, requireRole("client"), listMyOrders);

export default router;