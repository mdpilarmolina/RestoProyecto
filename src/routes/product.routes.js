import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  setAvailability,
} from "../controllers/product.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  idRule,
  productRules,
  productFilterRules,
  productAvailabilityRule,
} from "../middleware/productValidators.js";

const router = Router();

router.use(authenticate); // todas las rutas de productos requieren estar logueado

router.get("/", productFilterRules, validate, listProducts);
router.get("/:id", idRule, validate, getProduct);
router.post("/", requireRole("admin"), productRules, validate, createProduct);
router.put("/:id", requireRole("admin"), idRule, productRules, validate, updateProduct);
router.patch(
  "/:id/availability",
  requireRole("admin"),
  idRule,
  productAvailabilityRule,
  validate,
  setAvailability
);

export default router;