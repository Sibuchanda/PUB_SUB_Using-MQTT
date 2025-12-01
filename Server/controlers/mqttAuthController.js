import Device from "../models/Device.js";
import crypto from "crypto";
import dotenv from 'dotenv'
dotenv.config();

export const verifyMqttCredentials = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({
        allow: false,
        error: "Invalid payload",
        message: ""
      });
    }

    const device = await Device.findOne({ deviceId: username });
    if (!device) {
      return res.json({
        allow: false,
        error: "Device not registered",
        message: ""
      });
    }

    const originalPassword = process.env.SYSTEM_DEVICE_PASSWORD;
    if (!originalPassword) {
      return res.json({
        allow: false,
        error: "Server config missing",
        message: ""
      });
    }

    const derived = crypto.pbkdf2Sync(
      originalPassword,
      Buffer.from(device.salt, "base64"),
      100000,
      32,
      "sha256"
    );
    const expectedRePassword = derived.toString("base64");
    if (expectedRePassword !== password) {
      return res.json({
        allow: false,
        error: "Unauthorized",
        message: ""
      });
    }

    return res.json({
      allow: true,
      error: "",
      message: ""
    });

  } catch (err) {
    console.error("MQTT auth error:", err);
    return res.json({
      allow: false,
      error: "Server error",
      message: ""
    });
  }
};



export const verifyAcl = async (req, res) => {
  try {
    const { username, topic, acc } = req.body;

    if (!username || !topic) {
      return res.json({ allow: false });
    }

    const device = await Device.findOne({ deviceId: username });
    if (!device) return res.json({ allow: false });

    if (device.allowedTopics.includes(topic)) {
      return res.json({ allow: true });
    }

    return res.json({ allow: false });

  } catch (err) {
    console.error("ACL error:", err);
    return res.json({ allow: false });
  }
};

