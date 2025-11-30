// src/components/AuthButton.jsx
import React, { useState } from "react";
import { performAuthInit } from "../auth/authClient";
import { toast } from "react-hot-toast";

export default function AuthButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleAuthenticate = async () => {
    setLoading(true);
    setStatus("Processing authentication...");

    try {
      const result = await performAuthInit();

      console.log("AUTH RESULT:", result);

      setStatus("Authenticated successfully!");
      toast.success("Authenticated successfully!");

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
    <h2 className="text-xl font-semibold">Client Authentication</h2>

    <button
      onClick={handleAuthenticate}
      disabled={loading}
      className="border px-4 py-2 rounded w-48 disabled:opacity-50 cursor-pointer hover:bg-gray-300"
    >
      {loading ? "Authenticating..." : "Authenticate"}
    </button>

    {status && !loading && (
      <div className="text-blue-600 font-medium">
        {status}
      </div>
    )}
  </div>
);
}
