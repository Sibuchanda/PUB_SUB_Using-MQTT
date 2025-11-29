import express from "express";
import getServerPublicKey from "../controlers/keyControler.js";

const router = express.Router();

router.get("/public", getServerPublicKey);

export default router;
