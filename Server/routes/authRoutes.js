// routes/authRoutes.js
import express from "express";
import { initAuth } from "../controlers/authControler.js";

const router = express.Router();

router.post("/init", initAuth);

export default router;
