import mongoose from "mongoose";

// Estados del pedido: se crea como "Pedido realizado"; el administrador lo pasa a "Entregado" o "Cancelado"
export const ORDER_STATUSES = ["En espera", "Pedido realizado", "Entregado", "Cancelado"];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },   // copia del nombre al momento del pedido
    price: { type: Number, required: true },  // copia del precio al momento del pedido
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    table: { type: Number, required: [true, "El número de mesa es obligatorio"], min: 1 },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, "El pedido no puede estar vacío"],
    },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, maxlength: 200 }, // aclaraciones para cocina ("sin cebolla")
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pedido realizado",
    },
    closedAt: { type: Date }, // cuándo se entregó o se canceló
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);