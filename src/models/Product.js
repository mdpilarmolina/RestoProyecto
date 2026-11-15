import mongoose from "mongoose";

// Secciones de la carta, en el orden en que se muestran
export const CATEGORIES = ["entradas", "principales", "postres", "bebidas"];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    image: { type: String, required: [true, "La imagen (URL) es obligatoria"], trim: true },
    price: { type: Number, required: [true, "El precio es obligatorio"], min: 0 },
    description: { type: String, required: [true, "La descripción es obligatoria"], trim: true },
    available: { type: Boolean, default: true },

    // Para ordenar y agrupar la carta
    category: {
      type: String,
      enum: { values: CATEGORIES, message: "La categoría no es válida" },
      default: "principales",
    },
    sortOrder: { type: Number, default: 0, min: 0 }, // orden de aparición (menor = primero)

    // Opcionales
    ingredients: { type: [String], default: [] },
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false }, // "sin TACC"

    timesOrdered: { type: Number, default: 0 }, // para estadísticas
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);