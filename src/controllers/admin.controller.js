import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Reservation from "../models/Reservation.js";

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
  ] = await Promise.all([
    Product.find({ timesOrdered: { $gt: 0 } })
      .sort({ timesOrdered: -1, name: 1 }).limit(5).select("name price timesOrdered"),
    Product.find().sort({ timesOrdered: 1, name: 1 }).limit(5).select("name price timesOrdered"),
    User.find(clientsWithOrders).sort({ ordersCount: -1, name: 1 }).limit(5).select("name email ordersCount"),
    User.find(clientsWithOrders).sort({ ordersCount: 1, name: 1 }).limit(5).select("name email ordersCount"),
    Order.aggregate([{ $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$total" } } }]),
    Order.aggregate([
      { $group: { _id: "$table", orders: { $sum: 1 } } },
      { $sort: { orders: -1, _id: 1 } },
      { $limit: 5 },
    ]),
    User.countDocuments(activeClients),
    User.countDocuments({ ...activeClients, ordersCount: 0 }),
    Product.countDocuments(),
    Product.countDocuments({ available: false }),
  ]);

  const { orders = 0, revenue = 0 } = totals[0] || {};

  res.json({
    orders: {
      total: orders,
      revenue: round2(revenue),
      averageTicket: orders ? round2(revenue / orders) : 0,
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

export const listOrders = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [orders, total] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name email"),
    Order.countDocuments(),
  ]);

  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
};

export const listClients = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { role: "client" };

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
    filter.date = { $gte: start, $lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
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