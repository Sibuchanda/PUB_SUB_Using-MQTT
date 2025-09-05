import mqtt from "mqtt";
//Broker url
const brokerUrl = "mqtt://localhost:1883"; 
const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log("Connected to MQTT broker:", brokerUrl);
});

client.on("error", (err) => {
  console.error("MQTT connection error:", err);
});

export default client;
