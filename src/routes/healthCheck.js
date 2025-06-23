import { Router } from "express";
import { healthCheck } from "../Controller/healthCheck.controller.js";

const router = Router();

router.route("/").get(healthCheck)

export default router