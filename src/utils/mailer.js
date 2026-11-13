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