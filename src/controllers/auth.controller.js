import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const register = async (req, res) => {
  const { name, email, password } = req.body; // el rol NO se toma del body

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "El email ya está registrado" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, role: "client" });

  res.status(201).json({
    message: "Cuenta creada correctamente",
    token: signToken(user),
    user: publicUser(user),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  const valid = user && user.active && (await bcrypt.compare(password, user.password));

  // Mismo mensaje para email inexistente o contraseña incorrecta
  if (!valid) {
    return res.status(401).json({ message: "El email o la contraseña son incorrectos" });
  }

  res.json({
    message: "Inicio de sesión exitoso",
    token: signToken(user),
    user: publicUser(user),
  });
};