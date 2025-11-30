import Admin from "../models/admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });
  const token = jwt.sign({ role: "admin" }, process.env.ADMIN_SECRET_KEY, { expiresIn: "1h" });
  return res.json({ success: true, token });
};
