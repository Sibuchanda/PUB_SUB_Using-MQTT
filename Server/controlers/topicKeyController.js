import crypto from "crypto";
import Device from "../models/Device.js";
import TopicKey from "../models/topicKey.js";
import fs from "fs";

const privateKey = fs.readFileSync("./keys/private.pem", "utf8");

export const handleTopicKeyRequest = async (req, res) => {
  try {
    const { cipher } = req.body;

    if (!cipher) {
      return res.status(400).json({ error: "Missing encrypted payload (cipher)" });
    }
    const encryptedBuffer = Buffer.from(cipher, "base64");
    let decryptedJson;
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        encryptedBuffer
      );

      decryptedJson = JSON.parse(decrypted.toString());
    } catch (err) {
      console.error("RSA decrypt failed:", err);
      return res.status(400).json({ error: "Invalid encrypted payload" });
    }

    const { deviceHash, topic } = decryptedJson;

    if (!deviceHash || !topic) {
      return res.status(400).json({ error: "Invalid decrypted content" });
    }
    const device = await Device.findOne({ deviceHash });
    if (!device) {
      return res.status(401).json({ error: "Unknown device" });
    }

    if (!device.allowedTopics.includes(topic)) {
      return res.status(403).json({ error: "Device not authorized for topic" });
    }

    let topicKeyDoc = await TopicKey.findOne({ topic });

    if (!topicKeyDoc) {
      const newKey = crypto.randomBytes(32);
      topicKeyDoc = await TopicKey.create({
        topic,
        keyBase64: newKey.toString("base64"),
      });
      console.log("Generated new topic key for:", topic);
    }

    const topicKeyBase64 = topicKeyDoc.keyBase64;
    const sessionKeyBase64 = device.sessionKey;

    if (!sessionKeyBase64) {
      return res.status(500).json({ error: "Device session key not found" });
    }

    const sessionKeyRaw = Buffer.from(sessionKeyBase64, "base64");
    const iv = crypto.randomBytes(12);

    const cipherAES = crypto.createCipheriv("aes-256-gcm", sessionKeyRaw, iv);
    const encryptedTK = Buffer.concat([
      cipherAES.update(topicKeyBase64, "utf8"),
      cipherAES.final(),
    ]);
    const authTag = cipherAES.getAuthTag();
    
    return res.json({
      success: true,
      data: {
        iv: iv.toString("base64"),
        ciphertext: encryptedTK.toString("base64"),
        tag: authTag.toString("base64"),
      },
    });

  } catch (err) {
    console.error("Topic key request error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
