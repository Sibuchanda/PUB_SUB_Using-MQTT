// controllers/authController.js
import crypto from "crypto";
import { getPrivateKey } from "../utils/keyManager.js";
import Device from "../models/Device.js";

function base64ToBuffer(b64) {
  return Buffer.from(b64, "base64");
}
function bufferToBase64(buf) {
  return Buffer.from(buf).toString("base64");
}

export const initAuth = async (req, res) => {
  try {
    const { cipher } = req.body;
    if (!cipher) return res.status(400).json({ success: false, message: "Missing authentication details" });

    const privateKeyPem = getPrivateKey();
    const cipherBuf = base64ToBuffer(cipher);

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        oaepHash: "sha256",
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      cipherBuf
    );

    const decryptedStr = decrypted.toString("utf8");
    let payload;
    try {
      payload = JSON.parse(decryptedStr);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid decrypted payload" });
    }

    const { deviceHash, sessionKeyBase64 } = payload;
    if (!deviceHash || !sessionKeyBase64)
      return res.status(400).json({ success: false, message: "Invalid payload fields" });

    // Verifying Device details
    const device = await Device.findOne({ deviceHash });
    if (!device) {
      return res.status(401).json({ success: false, message: "Unauthorized system!" });
    }
    device.sessionKey = sessionKeyBase64;

    // Generating random salt (16 bytes)
    const salt = crypto.randomBytes(16);
    const saltB64 = bufferToBase64(salt);

    device.salt = saltB64;
    await device.save();

    const keyBuf = base64ToBuffer(sessionKeyBase64);
    if (keyBuf.length !== 32) {
      return res.status(400).json({ success: false, message: "Invalid session key length" });
    }

    const iv = crypto.randomBytes(12);
    const cipherAes = crypto.createCipheriv("aes-256-gcm", keyBuf, iv);
    const enc = Buffer.concat([cipherAes.update(salt), cipherAes.final()]);
    const tag = cipherAes.getAuthTag();

    return res.json({
      success: true,
      data: {
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(enc),
        tag: bufferToBase64(tag),
      },
    });
  } catch (err) {
    console.error("initAuth error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
