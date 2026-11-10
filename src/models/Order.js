import mongoose from "mongoose";

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
    status: {
      type: String,
      enum: ["En espera", "Pedido realizado"],
      default: "Pedido realizado",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);