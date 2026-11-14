import Order from "../models/Order.js";
import { buildItems, saveOrder } from "../utils/orderHelpers.js";

export const createOrder = async (req, res) => {
  const { table, items } = req.body;

  // Revisa productos y calcula el total (si hay un problema, responde con el error)
  const result = await buildItems(items);
  if (result.error) {
    return res.status(result.error.status).json(result.error.body);
  }

  // Guarda el pedido y suma los contadores
  const order = await saveOrder({
    userId: req.user._id,
    table,
    orderItems: result.orderItems,
    total: result.total,
  });

  res.status(201).json({ message: "Pedido realizado", order });
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
};