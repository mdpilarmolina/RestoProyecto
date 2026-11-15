import Product, { CATEGORIES } from "../models/Product.js";
import { escapeRegex } from "../utils/text.js";

// Solo estos campos se aceptan desde el body (timesOrdered nunca se toca desde afuera)
const FIELDS = [
  "name", "image", "price", "description", "available", "category", "sortOrder",
  "ingredients", "isVegetarian", "isVegan", "isGlutenFree",
];

const pickFields = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// Arma el filtro de Mongo a partir de ?category=&vegetarian=&vegan=&glutenFree=&search=
const buildFilter = (query) => {
  const filter = {};
  const and = [];

  if (query.category) filter.category = query.category;
  if (query.glutenFree === "true") filter.isGlutenFree = true;
  if (query.vegan === "true") filter.isVegan = true;
  // "Vegetariano" incluye lo vegano: un plato vegano también lo es
  if (query.vegetarian === "true") and.push({ $or: [{ isVegetarian: true }, { isVegan: true }] });
  // La búsqueda mira nombre, descripción e ingredientes
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), "i");
    and.push({ $or: [{ name: pattern }, { description: pattern }, { ingredients: pattern }] });
  }

  if (and.length > 0) filter.$and = and;
  return filter;
};

// Carta pública (sin login): solo los productos disponibles, sin datos internos
export const listMenu = async (req, res) => {
  const filter = { ...buildFilter(req.query), available: true };
  const products = await Product.find(filter).sort({ sortOrder: 1, name: 1 }).select("-timesOrdered");

  res.json({ products, categories: CATEGORIES, total: products.length });
};

// Listado para usuarios logueados: incluye los no disponibles (el front los marca como agotados)
export const listProducts = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 0, 0); // 0 = sin paginar
  const filter = buildFilter(req.query);

  const query = Product.find(filter).sort({ sortOrder: 1, name: 1 });
  if (req.user.role !== "admin") query.select("-timesOrdered"); // las estadísticas son del admin
  if (limit > 0) query.skip((page - 1) * limit).limit(limit);

  const [products, total] = await Promise.all([query.exec(), Product.countDocuments(filter)]);

  res.json({
    products,
    categories: CATEGORIES, // las secciones de la carta, en orden, para armar las pestañas del front
    total,
    page,
    pages: limit > 0 ? Math.ceil(total / limit) : 1,
  });
};

export const getProduct = async (req, res) => {
  const select = req.user.role !== "admin" ? "-timesOrdered" : "";
  const product = await Product.findById(req.params.id).select(select);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });
  res.json({ product });
};

export const createProduct = async (req, res) => {
  const product = await Product.create(pickFields(req.body));
  res.status(201).json({ message: "Producto creado", product });
};

export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pickFields(req.body), {
    new: true,           // devolver el producto ya actualizado
    runValidators: true, // aplicar las reglas del modelo también al actualizar
  });
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });
  res.json({ message: "Producto actualizado", product });
};

// Cambia solo la disponibilidad (un toque en hora pico, sin reenviar todos los campos)
export const setAvailability = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { available: req.body.available },
    { new: true }
  );
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  res.json({
    message: product.available ? "Producto disponible" : "Producto marcado como no disponible",
    product,
  });
};