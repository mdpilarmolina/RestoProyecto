import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "../routes/auth.routes.js";
import productRoutes from "../routes/product.routes.js";
import orderRoutes from "../routes/order.routes.js";
import accountRoutes from "../routes/account.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../public")));

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "RestoProyecto API funcionando" });
});

// Rutas de la API (siempre ANTES del 404)
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/account", accountRoutes);
// 404 para cualquier ruta no mapeada
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejo central de errores
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Error interno del servidor" });
});

export default app;