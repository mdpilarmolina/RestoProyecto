import { RESERVATION as R } from "../config/reservation.js";
import { RESTAURANT } from "../config/restaurant.js";

// Datos públicos del local y reglas de reserva, para que el front no los tenga duplicados
export const getInfo = (req, res) => {
  res.json({
    restaurant: {
      name: RESTAURANT.NAME,
      address: RESTAURANT.ADDRESS,
      phone: RESTAURANT.PHONE,
      coordinates:
        RESTAURANT.LAT !== null && RESTAURANT.LNG !== null
          ? { lat: RESTAURANT.LAT, lng: RESTAURANT.LNG }
          : null,
      maxTables: RESTAURANT.MAX_TABLES,
    },
    reservations: {
      openingHour: R.OPENING_HOUR,
      closingHour: R.CLOSING_HOUR,
      slotMinutes: 30,
      maxPeople: R.MAX_PEOPLE,
      minAdvanceMinutes: R.MIN_ADVANCE_MS / 60000,
      maxAdvanceDays: R.MAX_ADVANCE_DAYS,
      maxActivePerClient: R.MAX_ACTIVE_PER_CLIENT,
      cancelLimitMinutes: R.CANCEL_LIMIT_MS / 60000,
      durationMinutes: R.DURATION_MS / 60000,
      timezone: "America/Argentina/Tucuman",
      utcOffset: "-03:00",
    },
  });
};