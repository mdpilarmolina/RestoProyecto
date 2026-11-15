import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Reservation from "../models/Reservation.js";
import { revertOrderStats } from "../utils/orderHelpers.js";
import { escapeRegex } from "../utils/text.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (n) => Math.round(n * 100) / 100;

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const getStats = async (req, res) => {
  const activeClients = { role: "client", active: true };
  const clientsWithOrders = { role: "client", ordersCount: { $gt: 0 } };

  const [
    mostOrderedProducts,
    leastOrderedProducts,
    mostOrdersClients,
    fewestOrdersClients,
    totals,
    busiestTables,
    totalClients,
    clientsWithoutOrders,
    totalProducts,
    unavailableProducts,
    cancelledOrders,
  ] = await Promise.all([
    Product.find({ timesOrdered: { $gt: 0 } })
      .sort({ timesOrdered: -1, name: 1 }).limit(5).select("name price timesOrdered"),
    Product.find().sort({ timesOrdered: 1, name: 1 }).limit(5).select("name price timesOrdered"),
    User.find(clientsWithOrders).sort({ ordersCount: -1, name: 1 }).limit(5).select("name email ordersCount"),
    User.find(clientsWithOrders).sort({ ordersCount: 1, name: 1 }).limit(5).select("name email ordersCount"),
    // Los pedidos cancelados no cuentan como ventas ni como mesas ocupadas
    Order.aggregate([
      { $match: { status: { $ne: "Cancelado" } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: "Cancelado" } } },
      { $group: { _id: "$table", orders: { $sum: 1 } } },
      { $sort: { orders: -1, _id: 1 } },
      { $limit: 5 },
    ]),
    User.countDocuments(activeClients),
    User.countDocuments({ ...activeClients, ordersCount: 0 }),
    Product.countDocuments(),
    Product.countDocuments({ available: false }),
    Order.countDocuments({ status: "Cancelado" }),
  ]);

  const { orders = 0, revenue = 0 } = totals[0] || {};

  res.json({
    orders: {
      total: orders,
      revenue: round2(revenue),
      averageTicket: orders ? round2(revenue / orders) : 0,
      cancelled: cancelledOrders,
    },
    products: {
      total: totalProducts,
      unavailable: unavailableProducts,
      mostOrdered: mostOrderedProducts,
      leastOrdered: leastOrderedProducts,
    },
    clients: {
      total: totalClients,
      withoutOrders: clientsWithoutOrders,
      mostOrders: mostOrdersClients,
      fewestOrders: fewestOrdersClients,
    },
    busiestTables: busiestTables.map((t) => ({ table: t._id, orders: t.orders })),
  });
};

// Pedidos con filtros opcionales: ?date=2026-11-20&table=7&status=Pedido realizado
export const listOrders = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // ?date=AAAA-MM-DD -> pedidos de ese día (hora de Argentina)
  if (req.query.date) {
    const start = new Date(`${req.query.date}T00:00:00-03:00`);
    filter.createdAt = { $gte: start, $lt: new Date(start.getTime() + DAY_MS) };
  }
  if (req.query.table) filter.table = Number(req.query.table);
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name email"),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
};

// El administrador cierra un pedido: "Entregado" o "Cancelado" (solo desde "Pedido realizado")
export const setOrderStatus = async (req, res) => {
  // Una sola operación atómica: si dos personas lo intentan a la vez, solo una lo logra
    const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: "Pedido realizado" },
    { status: req.body.status, closedAt: new Date() },
    { returnDocument: "after" }
  );

  if (!order) {
    const exists = await Order.exists({ _id: req.params.id });
    return exists
      ? res.status(409).json({ message: "Solo se pueden modificar pedidos en estado 'Pedido realizado'" })
      : res.status(404).json({ message: "Pedido no encontrado" });
  }

  // Un pedido cancelado no cuenta en las estadísticas del cliente ni de los productos
  if (order.status === "Cancelado") await revertOrderStats(order);

  res.json({ message: `Pedido ${order.status.toLowerCase()}`, order });
};

// Clientes con búsqueda opcional: ?search=lucia (nombre o email)
export const listClients = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { role: "client" };

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [clients, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ clients, total, page, pages: Math.ceil(total / limit) });
};

export const listClientOrders = async (req, res) => {
  const client = await User.findOne({ _id: req.params.id, role: "client" });
  if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

  const orders = await Order.find({ user: client._id }).sort({ createdAt: -1 });
  res.json({ client, orders });
};

export const setClientActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (user.role === "admin") {
    return res.status(403).json({ message: "No se puede dar de baja al administrador" });
  }

  user.active = req.body.active;
  await user.save();

  res.json({
    message: user.active ? "Cliente reactivado" : "Cliente dado de baja",
    client: user,
  });
};

// Reservas: ?date=2026-11-20 muestra las de ese día (hora de Argentina)
export const listReservations = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.date) {
    const start = new Date(`${req.query.date.slice(0, 10)}T00:00:00-03:00`);
    filter.date = { $gte: start, $lt: new Date(start.getTime() + DAY_MS) };
  }

  const [reservations, total] = await Promise.all([
    Reservation.find(filter).sort({ date: 1 }).skip(skip).limit(limit).populate("user", "name email"),
    Reservation.countDocuments(filter),
  ]);

  res.json({ reservations, total, page, pages: Math.ceil(total / limit) });
};

export const setReservationStatus = async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

  if (reservation.status !== "confirmada") {
    return res.status(409).json({ message: "Solo se pueden modificar reservas confirmadas" });
  }

  reservation.status = req.body.status;
  await reservation.save();
  res.json({ message: "Reserva actualizada", reservation });
};