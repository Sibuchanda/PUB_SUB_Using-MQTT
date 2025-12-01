import express from "express";
import { handleTopicKeyRequest } from "../controlers/topicKeyController.js";

const router = express.Router();

router.post("/request", handleTopicKeyRequest);

export default router;
