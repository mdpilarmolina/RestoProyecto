const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const RESERVATION = {
  MAX_SEATS: Number(process.env.MAX_SEATS) || 40, // personas en simultáneo
  OPENING_HOUR: Number(process.env.OPENING_HOUR) || 12, // primera hora de reserva (hora local)
  CLOSING_HOUR: Number(process.env.CLOSING_HOUR) || 23, // no se aceptan reservas que empiecen desde esta hora
  DURATION_MS: 2 * HOUR, // cuánto tiempo ocupa el lugar una reserva
  MIN_ADVANCE_MS: 1 * HOUR, // anticipación mínima para reservar
  MAX_ADVANCE_DAYS: 30, // hasta cuántos días adelante se puede reservar
  MAX_ACTIVE_PER_CLIENT: 3, // reservas activas a la vez por cliente
  CANCEL_LIMIT_MS: 2 * HOUR, // se puede cancelar hasta 2 horas antes
  CHECKIN_EARLY_MS: (Number(process.env.CHECKIN_EARLY_MINUTES) || 30) * MINUTE, // "llegué" desde 30 min antes
};