import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

const encoder = new TextEncoder();

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
    ["encrypt", "decrypt"]
  );
}

function pad(data) {
  const blockSize = 16;
  const padLength = blockSize - (data.byteLength % blockSize);
  const padded = new Uint8Array(data.byteLength + padLength);
  padded.set(data);
  padded.fill(padLength, data.byteLength);
  return padded;
}

async function encryptMessage(plaintext) {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const padded = pad(encoder.encode(plaintext));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    padded
  );
  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
}

export default function Publisher() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message) {
      toast.error("Please enter a message to send!");
      return;
    }
    setLoading(true);
    try {
      const encrypted = await encryptMessage(message);
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/publish`, {
        encrypted,
      });

      if (res.data.success) {
        toast.success("Message sent successfully");
      } else {
        toast.error("Failed to send message");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error occured while sending message");
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 gap-10">
      <h2 className="text-4xl font-bold mb-4 text-blue-700">Publisher</h2>
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded mb-4 focus:outline-none"
          placeholder="Enter your message.."
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </div>
    </div>
  );
}
