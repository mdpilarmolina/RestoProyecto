import { Router } from "express";
import { getInfo } from "../controllers/info.controller.js";

const router = Router();

router.get("/", getInfo); // público, no requiere login

export default router;