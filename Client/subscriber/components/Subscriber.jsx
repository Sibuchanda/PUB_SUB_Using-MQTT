import AuthButton from "./AuthButton";
import mqtt from "mqtt";
import { useNavigate } from "react-router-dom";

export default function Subscriber() {
  const navigate = useNavigate();

  const connectToMqtt = () => {
    const deviceId = import.meta.env.VITE_DEVICE_ID;
    const rePassword = localStorage.getItem("subscriber_rePasswordBase64");
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    if (!rePassword) {
      alert("Please authenticate first.");
      return;
    }

    const client = mqtt.connect(socketUrl, {
      protocol: "ws",
      username: deviceId,
      password: rePassword,
      reconnectPeriod: 2000,
      connectTimeout: 30000
    });

    client.on("connect", () => {
      console.log("MQTT Connected Successfully (SUBSCRIBER)!");
      alert("Connected to MQTT broker successfully!");
      navigate("/topic-request");
    });

    client.on("error", (err) => {
      console.error("MQTT Error:", err);
      alert("MQTT Error: " + err.message);
    });

    client.on("close", () => {
      console.warn("MQTT connection closed");
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 gap-8">
      <AuthButton onAuthSuccess={connectToMqtt} />
    </div>
  );
}
