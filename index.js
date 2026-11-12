import app from "./src/server/app.js";
import { connectDB } from "./src/database/db.js";

const PORT = process.env.PORT || 3000;

await connectDB();
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));