import client from '../config/mqtt.js';


const publishMessage = async (req, res) => {
  try {
    const { encrypted } = req.body;
    if (!encrypted) {
      return res.status(400).json({ success: false, message: "No message provided" });
    }

    // MQTT topic
    const topic = "patient/encrypted";

    client.publish(topic, JSON.stringify(encrypted), (err) => {
      if (err) {
        console.error("Error Occured while publishing message : ", err);
        return res.status(500).json({ success: false, message: "MQTT publish failed" });
      }
      console.log("Published to topic:", topic, encrypted);
      return res.json({ success: true, message: "Message published successfully" });
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default publishMessage;
