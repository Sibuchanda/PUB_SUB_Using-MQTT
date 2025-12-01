import mongoose from "mongoose";

const topicKeySchema = new mongoose.Schema({
  topic: { type: String, required: true, unique: true },
  keyBase64: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TopicKey = mongoose.model("TopicKey", topicKeySchema);

export default TopicKey;
