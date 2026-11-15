// Escapa los caracteres especiales para buscar texto literal dentro de una expresión regular.
// Así, si alguien busca ".*" o "(", se busca ese texto tal cual y no actúa como patrón.
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");