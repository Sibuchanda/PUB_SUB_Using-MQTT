import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);
    if (decoded.role !== "admin") throw new Error();
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
