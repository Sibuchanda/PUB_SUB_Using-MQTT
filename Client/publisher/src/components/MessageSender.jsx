import mqtt from "mqtt";
import { useState } from "react";

export default function MessageSender() {
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    const topic = localStorage.getItem("currentTopic");
    const tk = localStorage.getItem(`TK_${topic}`);
    const deviceId = import.meta.env.VITE_DEVICE_ID;
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    if (!topic || !tk) {
      alert("Topic key not found. Please request topic key first.");
      return;
    }

    const client = mqtt.connect(socketUrl, {
      protocol: "ws",
      username: deviceId,
      password: localStorage.getItem("rePasswordBase64"),
    });

    client.on("connect", () => {
      console.log("MQTT Connected for message sending.");

      // --- Encrypt the message using TK_topic ------
      const encoder = new TextEncoder();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const keyRaw = Uint8Array.from(window.atob(tk), c => c.charCodeAt(0));
      window.crypto.subtle.importKey(
        "raw",
        keyRaw,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      ).then(cryptoKey => {
        return window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          cryptoKey,
          encoder.encode(message)
        );
      }).then(encrypted => {

        const encryptedB64 = window.btoa(
          String.fromCharCode(...new Uint8Array(encrypted))
        );
        const ivB64 = window.btoa(String.fromCharCode(...iv));

        const payload = JSON.stringify({
          iv: ivB64,
          ciphertext: encryptedB64
        });

        client.publish(topic, payload, () => {
          alert("Encrypted message sent!");
          client.end();
        });

      });
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-20">
      <h2 className="text-xl font-bold">Send Encrypted Message</h2>

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
    </div>
  );
}
