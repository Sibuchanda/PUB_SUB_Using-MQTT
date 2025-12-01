import express from "express";
import { verifyMqttCredentials, verifyAcl } from "../controlers/mqttAuthController.js";

const router = express.Router();
router.post("/auth", verifyMqttCredentials);
router.post("/acl", verifyAcl);

export default router;
