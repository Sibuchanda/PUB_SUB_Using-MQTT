import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  deviceHash: { type: String, required: true, unique: true },
  allowedTopics: [{ type: String }],
  sessionKey: { type: String },
  salt: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Device = mongoose.model("Device", deviceSchema);
export default Device;
