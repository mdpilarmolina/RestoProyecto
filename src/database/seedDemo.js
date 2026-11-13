import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const { DEMO_PASSWORD } = process.env;

if (!DEMO_PASSWORD) {
  console.error("Falta DEMO_PASSWORD en el .env");
  process.exit(1);
}

// Imagen provisoria: reemplázala por fotos reales (ver notas)
const img = (text) => `https://placehold.co/600x400?text=${encodeURIComponent(text)}`;

const products = [
  {
    name: "Empanadas tucumanas (x3)",
    price: 5400,
    description: "Tres empanadas de carne cortada a cuchillo, con cebolla de verdeo y comino.",
    ingredients: ["carne", "cebolla de verdeo", "comino", "huevo", "masa"],
  },
  {
    name: "Provoleta a la parrilla",
    price: 7200,
    description: "Provolone derretido a la parrilla con orégano y un toque de ají molido.",
    ingredients: ["provolone", "orégano", "ají molido"],
    isVegetarian: true,
  },
  {
    name: "Vigilante",
    price: 4500,
    description: "Queso fresco con dulce de membrillo, el postre clásico del bodegón.",
    ingredients: ["queso fresco", "dulce de membrillo"],
    isVegetarian: true,
  },
  {
    name: "Milanesa napolitana",
    price: 10500,
    description: "Milanesa de ternera con jamón, queso y salsa de tomate, con papas fritas.",
    ingredients: ["ternera", "jamón", "queso", "tomate", "papas"],
  },
  {
    name: "Bife de chorizo",
    price: 14800,
    description: "Corte grueso a la parrilla, con ensalada mixta de la casa.",
    ingredients: ["bife de chorizo", "lechuga", "tomate", "cebolla"],
    isGlutenFree: true,
  },
  {
    name: "Asado de tira",
    price: 15900,
    description: "Costillar a la parrilla cocido lento, con papas rústicas.",
    ingredients: ["asado de tira", "papas", "sal gruesa"],
    isGlutenFree: true,
  },
  {
    name: "Ravioles de ricota",
    price: 9600,
    description: "Ravioles caseros de ricota y espinaca con salsa fileto.",
    ingredients: ["ricota", "espinaca", "tomate", "albahaca"],
    isVegetarian: true,
  },
  {
    name: "Ensalada de lentejas",
    price: 7600,
    description: "Lentejas con zanahoria, morrón asado, cebolla morada y aceto.",
    ingredients: ["lentejas", "zanahoria", "morrón", "cebolla morada"],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },
  {
    name: "Locro criollo",
    price: 9800,
    description: "Guiso tradicional de maíz, zapallo y carnes. Solo en temporada de invierno.",
    ingredients: ["maíz", "zapallo", "porotos", "chorizo", "panceta"],
    available: false, // sirve para mostrar un producto no disponible en la demo
  },
  {
    name: "Flan casero con dulce de leche",
    price: 4800,
    description: "Flan casero con dulce de leche y crema.",
    ingredients: ["leche", "huevo", "azúcar", "dulce de leche", "crema"],
    isVegetarian: true,
  },
  {
    name: "Limonada con menta y jengibre",
    price: 3000,
    description: "Limonada exprimida, con menta fresca y jengibre.",
    ingredients: ["limón", "menta", "jengibre"],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },
  {
    name: "Agua saborizada de pomelo y romero",
    price: 3200,
    description: "Agua saborizada casera con pomelo y un toque de romero.",
    ingredients: ["pomelo", "romero"],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },
  {
    name: "Copa de Malbec",
    price: 4200,
    description: "Copa de Malbec de la casa.",
    ingredients: ["vino Malbec"],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
  },
  {
    name: "Café",
    price: 2800,
    description: "Café de filtro, con o sin leche.",
    ingredients: ["café"],
    isVegetarian: true,
  },
];

const clients = [
  { name: "Lucía Fernández", email: "lucia@example.com" },
  { name: "Martín Gómez", email: "martin@example.com" },
  { name: "Sofía Ramos", email: "sofia@example.com" },
  { name: "Diego Herrera", email: "diego@example.com" },
];

await connectDB();

for (const p of products) {
  await Product.updateOne(
    { name: p.name },
    { $set: { image: img(p.name), available: true, ...p }, $setOnInsert: { timesOrdered: 0 } },
    { upsert: true }
  );
}
console.log(`Productos cargados o actualizados: ${products.length}`);

const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
for (const c of clients) {
  await User.updateOne(
    { email: c.email },
    { $setOnInsert: { name: c.name, email: c.email, password: hash, role: "client" } },
    { upsert: true }
  );
}
console.log(`Clientes de demo asegurados: ${clients.length}`);

await mongoose.disconnect();