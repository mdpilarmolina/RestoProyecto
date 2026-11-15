import app from "./src/server/app.js";
import { connectDB } from "./src/database/db.js";

// 1. Variables obligatorias
const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Faltan variables de entorno: ${missing.join(", ")}`);
  process.exit(1);
}

// 2. Una clave corta se puede adivinar: exigimos al menos 32 caracteres
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET debe tener al menos 32 caracteres");
  process.exit(1);
}

// 3. En producción, CORS no puede quedar abierto a cualquier sitio por olvido
if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN) {
  console.error("En producción hay que definir CORS_ORIGIN (la URL de tu front)");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

await connectDB();
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));