import bcrypt from "bcryptjs";
import User from "../models/User.js";

const accountData = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  ordersCount: user.ordersCount,
  createdAt: user.createdAt,
});

export const getAccount = async (req, res) => {
  res.json({ user: accountData(req.user) });
};

export const updateName = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: req.body.name },
    { new: true, runValidators: true }
  );
  res.json({ message: "Nombre actualizado", user: accountData(user) });
};

export const updateEmail = async (req, res) => {
  const { email, currentPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: "La contraseña actual es incorrecta" });
  }

  const taken = await User.findOne({ email, _id: { $ne: user._id } });
  if (taken) {
    return res.status(409).json({ message: "Ese email ya está registrado" });
  }

  user.email = email;
  await user.save();
  res.json({ message: "Email actualizado", user: accountData(user) });
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: "La contraseña actual es incorrecta" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Contraseña actualizada" });
};