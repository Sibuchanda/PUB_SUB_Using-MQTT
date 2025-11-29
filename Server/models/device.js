import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  deviceHash: { type: String, required: true },
  allowedTopics: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const Device = mongoose.model("Device", deviceSchema);
export default Device;
