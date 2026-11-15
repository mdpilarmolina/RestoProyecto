import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "../routes/auth.routes.js";
import productRoutes from "../routes/product.routes.js";
import orderRoutes from "../routes/order.routes.js";
import accountRoutes from "../routes/account.routes.js";
import adminRoutes from "../routes/admin.routes.js";
import contactRoutes from "../routes/contact.routes.js";
import reservationRoutes from "../routes/reservation.routes.js";
import infoRoutes from "../routes/info.routes.js";
import menuRoutes from "../routes/menu.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1); // detrás del proxy del hosting, para que el rate limit vea la IP real
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "../../public")));

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "RestoProyecto API funcionando" });
});

// Rutas de la API (siempre ANTES del 404)
app.use("/api/info", infoRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/reservations", reservationRoutes);

// 404 para cualquier ruta no mapeada
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejo central de errores
app.use((err, req, res, next) => {
  console.error(err);

  let status = err.status || 500;
  let message = err.message || "Error interno del servidor";

  if (err.code === 11000) {
    // Dato único repetido (por ejemplo, dos registros con el mismo email al mismo tiempo)
    status = 409;
    message = err.keyPattern?.email
      ? "El email ya está registrado"
      : "Ya existe un registro con esos datos";
  } else if (err.name === "ValidationError") {
    status = 400; // el mensaje de Mongoose ya está en español (lo definimos en los modelos)
  } else if (err.name === "CastError") {
    status = 400;
    message = "Datos inválidos";
  }

  if (status === 500 && process.env.NODE_ENV === "production") {
    message = "Error interno del servidor";
  }

  res.status(status).json({ message });
});

export default app;