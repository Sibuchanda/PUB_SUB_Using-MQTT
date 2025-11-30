// routes/authRoutes.js
import express from "express";
import { adminLogin } from "../controlers/adminControler.js";
import { registerDevice } from "../controlers/deviceControler.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register-device", adminAuth, registerDevice);

export default router;
