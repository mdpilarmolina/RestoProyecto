import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import User from "../models/User.js";

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el .env");
  process.exit(1);
}

await connectDB();

const email = ADMIN_EMAIL.trim().toLowerCase();
const exists = await User.findOne({ email });

if (exists) {
  console.log("El administrador ya existe, no se crea de nuevo");
} else {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    name: ADMIN_NAME || "Administrador",
    email,
    password: hash,
    role: "admin",
  });
  console.log(`Administrador creado: ${email}`);
}

await mongoose.disconnect();