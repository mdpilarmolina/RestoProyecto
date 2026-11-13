import app from "./src/server/app.js";
import { connectDB } from "./src/database/db.js";

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Faltan variables de entorno: ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

await connectDB();
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));