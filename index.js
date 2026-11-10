import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]); // DNS de Google y Cloudflare

import app from "./src/server/app.js";
import { connectDB } from "./src/database/db.js";

const PORT = process.env.PORT || 3000;

await connectDB();
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));