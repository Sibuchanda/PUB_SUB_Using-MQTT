import crypto from "crypto";
import Device from "../models/Device.js";

export const registerDevice = async (req, res) => {
  const { deviceId, allowedTopics } = req.body;

  if (!deviceId || !allowedTopics)
    return res.status(400).json({ success: false, message: "Missing fields" });
    const deviceHash = crypto.createHash("sha256").update(deviceId).digest("base64");

   const exists = await Device.findOne({ deviceHash });
   if (exists) return res.status(409).json({ success: false, message: "Device already exists" });

  await Device.create({
    deviceId,
    deviceHash,
    allowedTopics: allowedTopics.trim()
  });

  return res.json({ success: true, message: "Device registered successfully" });
};
