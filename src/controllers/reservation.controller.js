import Reservation from "../models/Reservation.js";
import { RESERVATION as R } from "../config/reservation.js";
import { buildItems, saveOrder } from "../utils/orderHelpers.js";
import {
  sendReservationEmails,
  sendReservationCancelledEmails,
} from "../utils/mailer.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE = ["confirmada"];

// Argentina es UTC-3 todo el año (no usa horario de verano)
const LOCAL_OFFSET_MS = -3 * 60 * 60 * 1000;
const localHourAndMinutes = (date) => {
  const local = new Date(date.getTime() + LOCAL_OFFSET_MS);
  return { hour: local.getUTCHours(), minutes: local.getUTCMinutes() };
};
const pad = (n) => String(n).padStart(2, "0");

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

// Rango en el que una reserva nueva en `date` se superpone con otras
const overlapRange = (date) => ({
  $gt: new Date(date.getTime() - R.DURATION_MS),
  $lt: new Date(date.getTime() + R.DURATION_MS),
});

// Cuántas personas ya tienen lugar en ese horario (reservas que se superponen)
const seatsTaken = async (date) => {
  const overlapping = await Reservation.find({
    status: { $in: ACTIVE },
    date: overlapRange(date),
  }).select("people");
  return overlapping.reduce((sum, r) => sum + r.people, 0);
};

// Lo mismo, pero sobre una lista de reservas ya cargada (para calcular todo un día de una vez)
const seatsTakenIn = (reservations, date) =>
  reservations
    .filter(
      (r) =>
        r.date.getTime() > date.getTime() - R.DURATION_MS &&
        r.date.getTime() < date.getTime() + R.DURATION_MS
    )
    .reduce((sum, r) => sum + r.people, 0);

// Consultar un horario puntual. Un horario no válido NO es un error: responde available:false
export const checkAvailability = async (req, res) => {
  const date = new Date(req.query.date);
  const people = Number(req.query.people);

  const reason = slotError(date);
  if (reason) return res.json({ available: false, seatsLeft: 0, reason });

  const seatsLeft = Math.max(R.MAX_SEATS - (await seatsTaken(date)), 0);
  const available = seatsLeft >= people;
  res.json({
    available,
    seatsLeft,
    ...(available ? {} : { reason: "No hay lugar para esa cantidad de personas" }),
  });
};

// Todos los horarios de un día, listos para armar el selector del front
export const listSlots = async (req, res) => {
  const day = req.query.date; // AAAA-MM-DD
  const people = Number(req.query.people);

  const dayStart = new Date(`${day}T00:00:00-03:00`);
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);

  const existing = await Reservation.find({
    status: { $in: ACTIVE },
    date: {
      $gt: new Date(dayStart.getTime() - R.DURATION_MS),
      $lt: new Date(dayEnd.getTime() + R.DURATION_MS),
    },
  }).select("date people");

  const slots = [];
  for (let hour = R.OPENING_HOUR; hour < R.CLOSING_HOUR; hour++) {
    for (const minutes of [0, 30]) {
      const date = new Date(dayStart.getTime() + (hour * 60 + minutes) * 60 * 1000);
      const time = `${pad(hour)}:${pad(minutes)}`;

      const invalid = slotError(date);
      const seatsLeft = invalid ? 0 : Math.max(R.MAX_SEATS - seatsTakenIn(existing, date), 0);
      const available = !invalid && seatsLeft >= people;
      const reason = invalid || (available ? null : "No hay lugar para esa cantidad de personas");

      slots.push({
        time,
        dateTime: `${day}T${time}:00-03:00`, // listo para mandar al reservar
        available,
        seatsLeft,
        ...(reason ? { reason } : {}),
      });
    }
  }

  res.json({ date: day, people, slots });
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

  // El mismo cliente no puede tener dos reservas que se superpongan en horario
  const ownOverlap = await Reservation.exists({
    user: req.user._id,
    status: { $in: ACTIVE },
    date: overlapRange(date),
  });
  if (ownOverlap) {
    return res
      .status(409)
      .json({ message: "Ya tienes una reserva en un horario que se superpone con ese" });
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

  // El mail es un extra: si falla, la reserva igual queda hecha
  sendReservationEmails({ user: req.user, reservation }).catch((err) =>
    console.warn("No se pudo enviar el mail de la reserva:", err.message)
  );

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

  sendReservationCancelledEmails({ user: req.user, reservation }).catch((err) =>
    console.warn("No se pudo enviar el mail de cancelación:", err.message)
  );

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