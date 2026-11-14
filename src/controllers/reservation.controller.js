import Reservation from "../models/Reservation.js";
import { RESERVATION as R } from "../config/reservation.js";
import { buildItems, saveOrder } from "../utils/orderHelpers.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE = ["confirmada"];

// Argentina es UTC-3 todo el año (no usa horario de verano)
const LOCAL_OFFSET_MS = -3 * 60 * 60 * 1000;
const localHourAndMinutes = (date) => {
  const local = new Date(date.getTime() + LOCAL_OFFSET_MS);
  return { hour: local.getUTCHours(), minutes: local.getUTCMinutes() };
};

// Devuelve un mensaje de error si el horario no es válido, o null si está bien
const slotError = (date) => {
  if (Number.isNaN(date.getTime())) return "Fecha inválida";

  const now = Date.now();
  if (date.getTime() < now + R.MIN_ADVANCE_MS) {
    return "Debes reservar con al menos 1 hora de anticipación";
  }
  if (date.getTime() > now + R.MAX_ADVANCE_DAYS * DAY_MS) {
    return `Solo se puede reservar hasta ${R.MAX_ADVANCE_DAYS} días adelante`;
  }

  const { hour, minutes } = localHourAndMinutes(date);
  if (minutes % 30 !== 0) return "Los horarios de reserva son cada 30 minutos";
  if (hour < R.OPENING_HOUR || hour >= R.CLOSING_HOUR) {
    return `Se reserva entre las ${R.OPENING_HOUR}:00 y las ${R.CLOSING_HOUR}:00`;
  }
  return null;
};

// Cuántas personas ya tienen lugar en ese horario (reservas que se superponen)
const seatsTaken = async (date) => {
  const overlapping = await Reservation.find({
    status: { $in: ACTIVE },
    date: {
      $gt: new Date(date.getTime() - R.DURATION_MS),
      $lt: new Date(date.getTime() + R.DURATION_MS),
    },
  }).select("people");
  return overlapping.reduce((sum, r) => sum + r.people, 0);
};

export const checkAvailability = async (req, res) => {
  const date = new Date(req.query.date);
  const people = Number(req.query.people);

  const error = slotError(date);
  if (error) return res.status(400).json({ message: error });

  const seatsLeft = Math.max(R.MAX_SEATS - (await seatsTaken(date)), 0);
  res.json({ available: seatsLeft >= people, seatsLeft });
};

export const createReservation = async (req, res) => {
  const { people, notes, items = [] } = req.body;
  const date = new Date(req.body.date);

  const error = slotError(date);
  if (error) return res.status(400).json({ message: error });

  const activeCount = await Reservation.countDocuments({
    user: req.user._id,
    status: { $in: ACTIVE },
    date: { $gte: new Date() },
  });
  if (activeCount >= R.MAX_ACTIVE_PER_CLIENT) {
    return res.status(409).json({
      message: `Ya tienes ${R.MAX_ACTIVE_PER_CLIENT} reservas activas. Cancela una para hacer otra`,
    });
  }

  if ((await seatsTaken(date)) + people > R.MAX_SEATS) {
    return res
      .status(409)
      .json({ message: "No hay lugar para esa cantidad de personas en ese horario" });
  }

  // Platos opcionales: si no eligió, la reserva queda sin pedido anticipado
  let orderItems = [];
  let total = 0;
  if (items.length > 0) {
    const result = await buildItems(items);
    if (result.error) return res.status(result.error.status).json(result.error.body);
    ({ orderItems, total } = result);
  }

  const reservation = await Reservation.create({
    user: req.user._id,
    date,
    people,
    notes,
    items: orderItems,
    total,
  });

  res.status(201).json({ message: "Reserva confirmada", reservation });
};

export const listMyReservations = async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id }).sort({ date: -1 });
  res.json({ reservations });
};

export const cancelReservation = async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id });
  if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

  if (!ACTIVE.includes(reservation.status)) {
    return res.status(409).json({ message: "Esta reserva ya no se puede cancelar" });
  }
  if (reservation.date.getTime() - Date.now() < R.CANCEL_LIMIT_MS) {
    return res.status(409).json({ message: "Solo se puede cancelar hasta 2 horas antes" });
  }

  reservation.status = "cancelada";
  await reservation.save();
  res.json({ message: "Reserva cancelada", reservation });
};

// El cliente llegó: indica su mesa y, si había platos elegidos, se crea el pedido
export const checkinReservation = async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id });
  if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

  if (!ACTIVE.includes(reservation.status)) {
    return res.status(409).json({ message: "Esta reserva no está activa" });
  }

  const now = Date.now();
  const start = reservation.date.getTime();
  if (now < start - R.CHECKIN_EARLY_MS || now > start + R.DURATION_MS) {
    return res.status(409).json({ message: "Todavía no es horario de tu reserva, o ya pasó" });
  }

  let order = null;
  if (reservation.items.length > 0) {
    order = await saveOrder({
      userId: req.user._id,
      table: req.body.table,
      orderItems: reservation.items,
      total: reservation.total,
    });
    reservation.order = order._id;
  }

  reservation.status = "completada";
  await reservation.save();

  res.json({
    message: order
      ? "Bienvenido/a. Tu pedido ya fue enviado"
      : "Bienvenido/a. Ya puedes hacer tu pedido",
    reservation,
    order,
  });
};