import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import keyRoutes from './routes/keyRoutes.js'
import dotenv from 'dotenv';
dotenv.config();
import { ensureKeysExist } from "./utils/keyManager.js";

const app = express();
const PORT = 5000;

connectDB();
ensureKeysExist(); // This ensure RSA keys exist before the server starts

// middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/keys", keyRoutes);

app.listen(PORT, () => {
  console.log(` Server Listening to PORT : ${PORT}`);
});
