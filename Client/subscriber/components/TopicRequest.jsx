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

      const pem = await fetchServerPublicKey();
      const publicKey = await importRsaPublicKey(pem);

      const deviceHash = localStorage.getItem("subscriber_deviceHash");
      const sessionKeyBase64 = localStorage.getItem("subscriber_sessionKeyBase64");

      if (!deviceHash || !sessionKeyBase64) {
        alert("Subscriber is not authenticated.");
        return;
      }

      const payload = { deviceHash, topic };
      const cipherBase64 = await rsaEncryptPayload(publicKey, payload);

      setStatus("Sending request to server...");

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
      const sessionKey = await importSessionKeyFromBase64(sessionKeyBase64);

      const ivBuf = b64ToArrayBuffer(iv);
      const ctBuf = b64ToArrayBuffer(ciphertext);
      const tagBuf = b64ToArrayBuffer(tag);

      const ctWithTag = new Uint8Array(ctBuf.byteLength + tagBuf.byteLength);
      ctWithTag.set(new Uint8Array(ctBuf), 0);
      ctWithTag.set(new Uint8Array(tagBuf), ctBuf.byteLength);

      const plain = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
        sessionKey,
        ctWithTag
      );

      const decoder = new TextDecoder();
      const tkTopic = decoder.decode(plain);

      localStorage.setItem(`subscriber_TK_${topic}`, tkTopic);

      alert("Topic Key Retrieved Successfully!");
      setStatus("Topic key saved.");
      navigate("/message-display");

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
