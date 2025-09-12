import React, { useEffect, useState } from "react";
import mqtt from "mqtt";
import { toast } from "react-hot-toast";

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveKey() {
  const salt = encoder.encode("thisIsStaticSaltValue");
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${import.meta.env.VITE_SYMMETRIC_KEY}`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-CBC", length: 256 },
    false,
    ["decrypt"]
  );
}


function unpad(data) {
  const padLength = data[data.length - 1];
  return data.slice(0, data.length - padLength);
}

async function decryptMessage(encrypted) {
  try {
    const key = await deriveKey();
    const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      key,
      ciphertext
    );

    const unpadded = unpad(new Uint8Array(decrypted));
    return decoder.decode(unpadded);
  } catch (err) {
    console.error("Decryption failed:", err);
    return "[Decryption Failed]";
  }
}

export default function Subscriber() {
  const [messages, setMessages] = useState([]);
  const topic = "patient/record";

  useEffect(() => {
    const client = mqtt.connect(`${import.meta.env.VITE_SOCKET_URL}`);
    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.subscribe(topic, (err) => {
        if (!err) {
          toast.success(`Subscribed to ${topic}`);
        } else {
          toast.error("Subscription failed");
        }
      });
    });

    client.on("message", async (_, message) => {
      try {
        const parsed = JSON.parse(message.toString());
        const decrypted = await decryptMessage(parsed);
        setMessages((prev) => [decrypted, ...prev]);
      } catch (err) {
        console.error("Message error:", err);
        setMessages((prev) => ["[Invalid Message]", ...prev]);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 gap-8">
      <h2 className="text-4xl font-bold mb-4 text-blue-700">Subscriber</h2>
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-gray-500">No messages received.</p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className="p-2 rounded">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
