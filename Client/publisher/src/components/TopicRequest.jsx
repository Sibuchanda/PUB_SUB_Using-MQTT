import React, { useState } from "react";
import axios from "axios";
import {
  rsaEncryptPayload,
  importRsaPublicKey,
  fetchServerPublicKey,
  importSessionKeyFromBase64,
  b64ToArrayBuffer,
} from "../auth/authClient";
import { useNavigate } from "react-router-dom";

export default function TopicRequest() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const requestTopicKey = async () => {
    try {
      if (!topic.trim()) {
        alert("Please enter a topic!");
        return;
      }

      setStatus("Encrypting request...");

      // Load server public key again
      const pem = await fetchServerPublicKey();
      const publicKey = await importRsaPublicKey(pem);

      // Retrieve stored device data
      const deviceHash = localStorage.getItem("deviceHash");
      const sessionKeyBase64 = localStorage.getItem("sessionKeyBase64");

      if (!deviceHash || !sessionKeyBase64) {
        alert("Device is not authenticated.");
        return;
      }

      // Create payload { deviceHash, topic }
      const payload = { deviceHash, topic };

      // Encrypt using RSA-OAEP → CM3
      const cipherBase64 = await rsaEncryptPayload(publicKey, payload);

      setStatus("Sending request to server...");

      // Send CM3 to backend
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/topic/request`,
        { cipher: cipherBase64 }
      );

      if (!res.data.success) {
        alert("Server rejected: " + res.data.error);
        return;
      }

      const { iv, ciphertext, tag } = res.data.data;

      setStatus("Decrypting topic key...");

      // Import session key
      const sessionKey = await importSessionKeyFromBase64(sessionKeyBase64);

      // Convert base64 → ArrayBuffer
      const ivBuf = b64ToArrayBuffer(iv);
      const ctBuf = b64ToArrayBuffer(ciphertext);
      const tagBuf = b64ToArrayBuffer(tag);

      // Combine ciphertext + tag
      const ctWithTag = new Uint8Array(ctBuf.byteLength + tagBuf.byteLength);
      ctWithTag.set(new Uint8Array(ctBuf), 0);
      ctWithTag.set(new Uint8Array(tagBuf), ctBuf.byteLength);

      // Decrypt AES-GCM (CM4 → TK_topic)
      const plain = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
        sessionKey,
        ctWithTag
      );

      const decoder = new TextDecoder();
      const tkTopic = decoder.decode(plain); // decrypted topic key (base64 string)

      // Save it for Phase 5
      let requestedTopic=topic.trim();
      localStorage.setItem(`currentTopic`, requestedTopic);
      localStorage.setItem(`TK_${topic}`, tkTopic);

      alert("Topic Key Retrieved Successfully!");
      setStatus("Topic key saved.");
      navigate("/send-message");
    } catch (err) {
      console.error("Topic key error:", err);
      alert("Failed: " + err.message);
      setStatus("Error occurred.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 mt-20">
      <h2 className="text-xl font-bold">Request Topic Key</h2>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter topic (e.g., /patient/heartRate)"
        className="border px-3 py-2 rounded w-80"
      />

      <button
        onClick={requestTopicKey}
        className="border px-4 py-2 rounded w-48 disabled:opacity-50 cursor-pointer hover:bg-gray-300"
      >
        Request
      </button>

      {status && <p className="text-gray-700 font-medium">{status}</p>}
    </div>
  );
}
