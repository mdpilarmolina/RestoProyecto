// Datos del local. Todo se puede cambiar desde el .env sin tocar el código.
export const RESTAURANT = {
  NAME: process.env.RESTAURANT_NAME || "Casa Quebracho",
  ADDRESS: process.env.RESTAURANT_ADDRESS || null,
  PHONE: process.env.RESTAURANT_PHONE || null,
  LAT: process.env.RESTAURANT_LAT ? Number(process.env.RESTAURANT_LAT) : null,
  LNG: process.env.RESTAURANT_LNG ? Number(process.env.RESTAURANT_LNG) : null,
  MAX_TABLES: Number(process.env.MAX_TABLES) || 30, // mesas numeradas del 1 al MAX_TABLES
};