import React, { useState } from "react";
import { performAuthInit } from "../auth/authClient";
import { toast } from "react-hot-toast";

export default function AuthButton({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleAuthenticate = async () => {
    setLoading(true);
    setStatus("Processing authentication...");

    try {
      const result = await performAuthInit();
      console.log("AUTH RESULT (SUBSCRIBER):", result);

      localStorage.setItem("subscriber_deviceHash", result.deviceHash);
      localStorage.setItem("subscriber_sessionKeyBase64", result.sessionKeyBase64);
      localStorage.setItem("subscriber_rePasswordBase64", result.rePasswordBase64);

      setStatus("Authenticated successfully!");
      toast.success("Authenticated successfully!");

      if (onAuthSuccess) onAuthSuccess();

    } catch (error) {
      console.error("AUTH ERROR:", error);
      setStatus("Authentication failed");
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-10">
      <h2 className="text-xl font-semibold">Subscriber Authentication</h2>

      <button
        onClick={handleAuthenticate}
        disabled={loading}
        className="border px-4 py-2 rounded w-48 disabled:opacity-50 cursor-pointer hover:bg-gray-300"
      >
        {loading ? "Authenticating..." : "Authenticate"}
      </button>

      {status && !loading && (
        <div className="text-green-600 font-medium">
          {status}
        </div>
      )}
    </div>
  );
}
