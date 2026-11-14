import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  RESTAURANT_EMAIL,
  RESTAURANT_NAME = "Casa Quebracho",
} = process.env;

const FROM_ADDRESS = MAIL_FROM || "no-reply@casaquebracho.com";
const PAUSE_MS = Number(process.env.MAIL_PAUSE_MS) || 0;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

// Evita saltos de línea dentro de datos que van a encabezados del mail
const clean = (text) => String(text).replace(/[\r\n]+/g, " ");

const send = async (options) => {
  if (!transporter) throw new Error("El servicio de mail no está configurado");
  await transporter.sendMail({ from: `"${RESTAURANT_NAME}" <${FROM_ADDRESS}>`, ...options });
};

// Fecha legible en hora de Argentina, por ejemplo "viernes, 20 de noviembre de 2026, 21:00"
const formatDate = (date) =>
  new Date(date).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Tucuman",
    dateStyle: "full",
    timeStyle: "short",
  });

const formatMoney = (amount) => `$${Number(amount).toLocaleString("es-AR")}`;

// Texto con los platos elegidos de una reserva (o aviso de que no eligió ninguno)
const describeItems = (reservation) => {
  if (!reservation.items || reservation.items.length === 0) {
    return "Sin comida elegida (pedirás al llegar).";
  }
  const lines = reservation.items.map(
    (i) => `- ${i.quantity} x ${i.name} (${formatMoney(i.price * i.quantity)})`
  );
  return `${lines.join("\n")}\nTotal: ${formatMoney(reservation.total)}`;
};

export const sendWelcomeEmail = (user) =>
  send({
    to: user.email,
    subject: `¡Bienvenido/a a ${RESTAURANT_NAME}!`,
    text: `Hola ${user.name},\n\nTu cuenta se creó correctamente. Ya puedes iniciar sesión y hacer tus pedidos desde la mesa.\n\n¡Que lo disfrutes!\n${RESTAURANT_NAME}`,
  });

export const sendContactEmails = async ({ name, email, message }) => {
  // 1. Confirmación para quien escribió (si falla, el controlador responde con error)
  await send({
    to: email,
    subject: "Recibimos tu consulta",
    text: `Hola ${name},\n\nRecibimos tu consulta y te responderemos a la brevedad.\n\nTu mensaje:\n${message}\n\n${RESTAURANT_NAME}`,
  });

  // 2. Aviso al restaurante con los datos de la consulta
  wait(PAUSE_MS)
    .then(() =>
      send({
        to: RESTAURANT_EMAIL || FROM_ADDRESS,
        replyTo: email,
        subject: `Nueva consulta de ${clean(name)}`,
        text: `Nueva consulta desde el sitio web.\n\nNombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
      })
    )
    .catch((err) => console.error("No se pudo enviar el aviso al restaurante:", err.message));
};

// Reserva nueva: confirmación al cliente y aviso al restaurante
export const sendReservationEmails = async ({ user, reservation }) => {
  const when = formatDate(reservation.date);
  const notes = reservation.notes ? `\nNotas: ${reservation.notes}` : "";

  await send({
    to: user.email,
    subject: `Reserva confirmada para el ${when}`,
    text:
      `Hola ${user.name},\n\n` +
      `Tu reserva quedó confirmada.\n\n` +
      `Cuándo: ${when}\n` +
      `Personas: ${reservation.people}${notes}\n\n` +
      `Tu pedido anticipado:\n${describeItems(reservation)}\n\n` +
      `Puedes cancelar hasta 2 horas antes desde la aplicación. ` +
      `Cuando llegues, indica tu número de mesa para que tu pedido salga enseguida.\n\n` +
      `${RESTAURANT_NAME}`,
  });

  wait(PAUSE_MS)
    .then(() =>
      send({
        to: RESTAURANT_EMAIL || FROM_ADDRESS,
        replyTo: user.email,
        subject: `Nueva reserva de ${clean(user.name)} - ${when}`,
        text:
          `Nueva reserva desde el sitio web.\n\n` +
          `Cliente: ${user.name} (${user.email})\n` +
          `Cuándo: ${when}\n` +
          `Personas: ${reservation.people}${notes}\n\n` +
          `Pedido anticipado:\n${describeItems(reservation)}`,
      })
    )
    .catch((err) => console.error("No se pudo avisar la reserva al restaurante:", err.message));
};

// Reserva cancelada por el cliente: aviso a los dos
export const sendReservationCancelledEmails = async ({ user, reservation }) => {
  const when = formatDate(reservation.date);

  await send({
    to: user.email,
    subject: `Reserva cancelada (${when})`,
    text: `Hola ${user.name},\n\nTu reserva para el ${when} (${reservation.people} personas) fue cancelada.\n\nCuando quieras, puedes hacer una nueva.\n\n${RESTAURANT_NAME}`,
  });

  wait(PAUSE_MS)
    .then(() =>
      send({
        to: RESTAURANT_EMAIL || FROM_ADDRESS,
        replyTo: user.email,
        subject: `Reserva cancelada por ${clean(user.name)} - ${when}`,
        text: `El cliente ${user.name} (${user.email}) canceló su reserva del ${when} para ${reservation.people} personas.`,
      })
    )
    .catch((err) => console.error("No se pudo avisar la cancelación al restaurante:", err.message));
};