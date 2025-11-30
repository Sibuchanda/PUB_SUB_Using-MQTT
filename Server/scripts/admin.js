import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();


import Admin from "../models/admin.js";

const username = process.env.ADMIN_USER_NAME;
const password = process.env.ADMIN_PASS;

const run = async () => {
  await connectDB();
  const exists = await Admin.findOne({ username });
  if (exists) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await Admin.create({ username, passwordHash: hash });

  console.log("Admin created successfully");
  process.exit(0);
};

await run();
