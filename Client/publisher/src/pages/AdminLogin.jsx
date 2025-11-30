import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/admin/login`, {
        username,
        password
      });
      localStorage.setItem("adminToken", res.data.token);
      navigate("/register-device");
    } catch {
      alert("Invalid login");
    }
  };

return (
  <div className="flex flex-col items-center mt-10 gap-3">
    <h2 className="text-lg font-medium">Admin Login</h2>

    <input
      placeholder="Username"
      onChange={e => setUsername(e.target.value)}
      className="border px-2 py-1 rounded w-60"
    />

    <input
      type="password"
      placeholder="Password"
      onChange={e => setPassword(e.target.value)}
      className="border px-2 py-1 rounded w-60"
    />

    <button
      onClick={handleLogin}
      className="border px-3 py-1 rounded w-60 cursor-pointer hover:bg-gray-300"
    >
      Login
    </button>
  </div>
);


}