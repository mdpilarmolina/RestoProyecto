import { Router } from "express";
import { listMenu } from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.js";
import { productFilterRules } from "../middleware/productValidators.js";

const router = Router();

// Carta pública: no requiere login
router.get("/", productFilterRules, validate, listMenu);

export default router;