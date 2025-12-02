import React, { useState } from "react";
import mqtt from "mqtt";

function b64ToBytes(b64) {
  const binary = window.atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function MessageSender() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const sendMessage = async () => {
    try {
      const topic = localStorage.getItem("currentTopic");
      const tkBase64 = localStorage.getItem(`TK_${topic}`);
      const deviceId = import.meta.env.VITE_DEVICE_ID;
      const socketUrl = import.meta.env.VITE_SOCKET_URL;
      const rePassword = localStorage.getItem("rePasswordBase64");

      if (!topic || !tkBase64) {
        alert("Topic key not found. Please request topic key first.");
        return;
      }

      if (!message.trim()) {
        alert("Please enter a message.");
        return;
      }

      setStatus("Connecting to MQTT...");

      const client = mqtt.connect(socketUrl, {
        protocol: "ws",
        username: deviceId,
        password: rePassword,
        reconnectPeriod: 0,
        connectTimeout: 10000,
      });

      client.on("connect", async () => {
        console.log("MQTT Connected for message sending.");
        setStatus("Encrypting and sending...");

        try {
          const encoder = new TextEncoder();
          const plainBytes = encoder.encode(message);

          // --- Compute SHA-256 hash of plaintext ---
          const hashBuf = await window.crypto.subtle.digest(
            "SHA-256",
            plainBytes
          );
          const hashB64 = bytesToB64(new Uint8Array(hashBuf));

          // --- Prepare AES-GCM key from TK_topic (base64) ---
          const keyBytes = b64ToBytes(tkBase64);
          const cryptoKey = await window.crypto.subtle.importKey(
            "raw",
            keyBytes,
            { name: "AES-GCM" },
            false,
            ["encrypt"]
          );

          // --- Generate IV and encrypt ---
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          const encryptedBuf = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            plainBytes
          );

          const ctB64 = bytesToB64(new Uint8Array(encryptedBuf));
          const ivB64 = bytesToB64(iv);

          const payload = JSON.stringify({
            iv: ivB64,
            ciphertext: ctB64,
            hash: hashB64,
          });

          client.publish(topic, payload, {}, () => {
            alert("Message sent to broker successfully");
            setStatus("Message sent.");
            setMessage("");
            client.end();
          });
        } catch (err) {
          alert("Failed to encrypt/send: " + err.message);
          setStatus("Error.");
          client.end();
        }
      });

      client.on("error", (err) => {
        console.error("MQTT error on send:", err);
        alert("MQTT error: " + err.message);
        setStatus("MQTT error.");
        client.end();
      });
    } catch (err) {
      console.error("SendMessage error:", err);
      alert("Error: " + err.message);
      setStatus("Error.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-20">
      <h2 className="text-xl font-bold">Send Message</h2>

      <textarea
        className="border px-3 py-2 rounded w-80 h-32"
        placeholder="Enter message to send..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="border px-4 py-2 rounded w-48 disabled:opacity-50 cursor-pointer hover:bg-gray-300"
        onClick={sendMessage}
      >
        Send Message
      </button>

      {status && <p className="text-gray-700 font-medium">{status}</p>}
    </div>
  );
}
