import axios from "axios";
import { useState } from "react";

export default function RegisterDevice() {
  const [deviceId, setDeviceId] = useState("");
  const [topics, setTopics] = useState("");

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/admin/register-device`,
        { deviceId, allowedTopics: topics },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeviceId("");
      setTopics("");
      alert("Device registered!");
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || "Unknown error"));
    }
  };

return (
  <div className="flex flex-col items-center mt-10 gap-3">
    <h2 className="text-lg font-medium">Register Device</h2>

    <input
      placeholder="Device ID"
      value={deviceId}
      onChange={e => setDeviceId(e.target.value)}
      className="border px-2 py-1 rounded w-60"
    />

    <input
      placeholder="Allowed Topics (Ex: patient/bloodpressure)"
      value={topics}
      onChange={e => setTopics(e.target.value)}
      className="border px-2 py-1 rounded w-60"
    />

    <button
      onClick={handleRegister}
      className="border px-3 py-1 rounded w-60 cursor-pointer hover:bg-gray-300"
    >
      Submit
    </button>
  </div>
);

}
