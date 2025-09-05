import express from "express";
const { publishMessage } = require("../controllers/publishController");
const router = express.Router();

router.post("/publish", publishMessage);


export default router;
