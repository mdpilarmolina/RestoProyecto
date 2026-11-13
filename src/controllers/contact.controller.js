import { sendContactEmails } from "../utils/mailer.js";

export const sendContact = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    await sendContactEmails({ name, email, message });
  } catch (error) {
    console.error("Error al enviar el mail de contacto:", error.message);
    return res
      .status(502)
      .json({ message: "No pudimos enviar tu consulta. Inténtalo de nuevo más tarde." });
  }

  res.json({ message: "Consulta enviada correctamente" });
};