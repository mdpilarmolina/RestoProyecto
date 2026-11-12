import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ¿Quién eres? Verifica el token y deja al usuario en req.user
export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "No autenticado: falta el token" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }

  const user = await User.findById(payload.id);
  if (!user || !user.active) {
    return res.status(401).json({ message: "La cuenta no existe o fue dada de baja" });
  }

  req.user = user;
  next();
};

// ¿Qué puedes hacer? Solo deja pasar a los roles indicados
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "No tienes permiso para acceder a este recurso" });
  }
  next();
};