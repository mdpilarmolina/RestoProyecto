import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Revisa los productos del pedido y calcula el total con los precios REALES de la base.
// Devuelve { orderItems, total } si todo está bien, o { error: { status, body } } si hay un problema.
export const buildItems = async (items) => {
  // 1. Unificar productos repetidos (si el mismo id viene dos veces, se suman)
  const quantities = new Map();
  for (const item of items) {
    const id = String(item.productId);
    quantities.set(id, (quantities.get(id) || 0) + (item.quantity ?? 1));
  }

  // 2. Buscar los productos REALES en la base
  const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
  if (products.length !== quantities.size) {
    return { error: { status: 400, body: { message: "Algún producto del pedido no existe" } } };
  }

  // 3. Rechazar los que no están disponibles
  const unavailable = products.filter((p) => !p.available);
  if (unavailable.length > 0) {
    return {
      error: {
        status: 409,
        body: {
          message: "Hay productos que ya no están disponibles",
          unavailable: unavailable.map((p) => ({ id: p._id, name: p.name })),
        },
      },
    };
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

  return { orderItems, total };
};

// Guarda el pedido y actualiza los contadores para las estadísticas
export const saveOrder = async ({ userId, table, orderItems, total }) => {
  const order = await Order.create({ user: userId, table, items: orderItems, total });

  await Promise.all([
    User.updateOne({ _id: userId }, { $inc: { ordersCount: 1 } }),
    Product.bulkWrite(
      orderItems.map((i) => ({
        updateOne: { filter: { _id: i.product }, update: { $inc: { timesOrdered: i.quantity } } },
      }))
    ),
  ]);

  return order;
};