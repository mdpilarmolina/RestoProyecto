import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "El formato del email no es válido"],
    },
    password: {
      type: String,
      required: true,
      select: false, // no se devuelve en las consultas salvo que lo pidamos
    },
    role: {
      type: String,
      enum: ["client", "admin"],
      default: "client",
    },
    ordersCount: { type: Number, default: 0 }, // extra: pedidos por cliente
    active: { type: Boolean, default: true },  // baja lógica (extra del admin)
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);