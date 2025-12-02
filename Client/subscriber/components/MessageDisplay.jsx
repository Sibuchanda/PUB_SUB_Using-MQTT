import React, { useEffect, useState } from "react";
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

const topic = import.meta.env.VITE_SUBSCRIBER_TOPIC;

export default function MessageDisplay() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const deviceId = import.meta.env.VITE_DEVICE_ID;
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    const rePassword = localStorage.getItem("subscriber_rePasswordBase64");

    if (!topic) {
      setStatus("No topic set. Please request topic key first.");
      return;
    }

    const client = mqtt.connect(socketUrl, {
      protocol: "ws",
      username: deviceId,
      password: rePassword,
      reconnectPeriod: 2000,
      connectTimeout: 20000,
    });

    client.on("connect", () => {
      console.log("Subscriber MQTT connected");
      setStatus("Subscribed to: " + topic);
      client.subscribe(topic);
    });

    client.on("message", async (recvTopic, payload) => {
      try {
        const parsed = JSON.parse(payload.toString());
        const { iv, ciphertext, hash } = parsed;

        const tkBase64 = localStorage.getItem(`subscriber_TK_${recvTopic}`);

        if (!tkBase64) {
          setLogs((prev) => [
            { time: new Date().toLocaleTimeString(), topic: recvTopic, plaintext: null, integrity: "NO TK_TOPIC" },
            ...prev,
          ]);
          return;
        }

        const keyBytes = b64ToBytes(tkBase64);
        const cryptoKey = await window.crypto.subtle.importKey(
          "raw",
          keyBytes,
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        );

        const ivBytes = b64ToBytes(iv);
        const ctBytes = b64ToBytes(ciphertext);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: ivBytes },
          cryptoKey,
          ctBytes
        );

        const decoder = new TextDecoder();
        const plaintext = decoder.decode(decryptedBuffer);

        const encoder = new TextEncoder();
        const hashCalc = await window.crypto.subtle.digest("SHA-256", encoder.encode(plaintext));
        const hashCalcB64 = bytesToB64(new Uint8Array(hashCalc));

        const integrity = hashCalcB64 === hash ? "OK" : "FAILED";

        setLogs((prev) => [
          { time: new Date().toLocaleTimeString(), topic: recvTopic, plaintext, integrity },
          ...prev,
        ]);

      } catch (error) {
        console.error("Decryption error:", error);
      }
    });

    return () => client.end();
  }, []);

  return (
    <div className="p-5">
      <div className="w-full flex flex-col items-center justify-center">
      <h2 className="text-4xl font-bold">Subscriber – Message</h2>
      <p>{status}</p>
      </div>

      <div className="mt-5 space-y-3">
        {logs.map((log, i) => (
          <div key={i} className="border p-3 rounded">
            <div><b>Time:</b> {log.time}</div>
            <div><b>Topic:</b>{log.topic}</div>
            <div><b>Message:</b> <span className="font-bold text-green-400"> {log.plaintext ?? "(none)"}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
