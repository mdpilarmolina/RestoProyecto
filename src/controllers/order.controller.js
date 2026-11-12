import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const createOrder = async (req, res) => {
  const { table, items } = req.body;

  // 1. Unificar productos repetidos (si el mismo id viene dos veces, se suman)
  const quantities = new Map();
  for (const item of items) {
    const id = String(item.productId);
    quantities.set(id, (quantities.get(id) || 0) + (item.quantity ?? 1));
  }

  // 2. Buscar los productos REALES en la base
  const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
  if (products.length !== quantities.size) {
    return res.status(400).json({ message: "Algún producto del pedido no existe" });
  }

  // 3. Rechazar los que no están disponibles
  const unavailable = products.filter((p) => !p.available);
  if (unavailable.length > 0) {
    return res.status(409).json({
      message: "Hay productos que ya no están disponibles",
      unavailable: unavailable.map((p) => ({ id: p._id, name: p.name })),
    });
  }

  // 4. Armar los ítems con nombre y precio de la base, y calcular el total
  const orderItems = products.map((p) => ({
    product: p._id,
    name: p.name,
    price: p.price,
    quantity: quantities.get(String(p._id)),
  }));
  const total =
    Math.round(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;

  // 5. Guardar el pedido
  const order = await Order.create({ user: req.user._id, table, items: orderItems, total });

  // 6. Actualizar contadores para las estadísticas
  await Promise.all([
    User.updateOne({ _id: req.user._id }, { $inc: { ordersCount: 1 } }),
    Product.bulkWrite(
      orderItems.map((i) => ({
        updateOne: { filter: { _id: i.product }, update: { $inc: { timesOrdered: i.quantity } } },
      }))
    ),
  ]);

  res.status(201).json({ message: "Pedido realizado", order });
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
};