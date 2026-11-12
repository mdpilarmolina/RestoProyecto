import { Router } from "express";
import {
  getAccount,
  updateName,
  updateEmail,
  updatePassword,
} from "../controllers/account.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { nameRules, emailRules, passwordRules } from "../middleware/accountValidators.js";

const router = Router();

router.use(authenticate, requireRole("client"));

router.get("/", getAccount);
router.patch("/", nameRules, validate, updateName);
router.patch("/email", emailRules, validate, updateEmail);
router.patch("/password", passwordRules, validate, updatePassword);

export default router;