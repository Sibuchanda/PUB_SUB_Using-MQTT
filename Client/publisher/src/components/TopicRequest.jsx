import React, { useState } from "react";

export default function TopicRequest() {
  const [topic, setTopic] = useState("");

  const handleSubmit = () => {
    alert("Topic requested: " + topic);
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-20">
      <h2 className="text-xl font-bold">Request Topic Key</h2>

      <input 
        placeholder="Enter topic (e.g., /patient/heartRate)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="border px-3 py-2 rounded w-80"
      />

      <button
        onClick={handleSubmit}
        className="border px-4 py-2 rounded w-48 disabled:opacity-50 cursor-pointer hover:bg-gray-300"
      >
        Request
      </button>
    </div>
  );
}
