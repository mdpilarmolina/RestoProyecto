import Product from "../models/Product.js";

// Solo estos campos se aceptan desde el body (timesOrdered nunca se toca desde afuera)
const FIELDS = [
  "name", "image", "price", "description", "available",
  "ingredients", "isVegetarian", "isVegan", "isGlutenFree",
];

const pickFields = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

export const listProducts = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 0, 0); // 0 = sin paginar

  const query = Product.find().sort({ name: 1 });
  if (req.user.role !== "admin") query.select("-timesOrdered"); // las estadísticas son del admin
  if (limit > 0) query.skip((page - 1) * limit).limit(limit);

  const [products, total] = await Promise.all([query.exec(), Product.countDocuments()]);

  res.json({
    products,
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