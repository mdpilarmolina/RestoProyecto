import mongoose from "mongoose";

const preorderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // copia del nombre al reservar
    price: { type: Number, required: true }, // copia del precio al reservar
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: [true, "La fecha y hora son obligatorias"] },
    people: { type: Number, required: true, min: 1, max: 12 },
    notes: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ["confirmada", "cancelada", "completada", "no_asistio"],
      default: "confirmada",
    },
    items: { type: [preorderItemSchema], default: [] }, // vacío = no eligió comida
    total: { type: Number, default: 0, min: 0 },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // se completa al llegar
  },
  { timestamps: true }
);

reservationSchema.index({ date: 1, status: 1 }); // acelera "qué reservas hay en este horario"

export default mongoose.model("Reservation", reservationSchema);