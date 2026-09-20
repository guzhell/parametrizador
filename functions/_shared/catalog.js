// Catálogo espejo del que usa el frontend (index.html).
// Si agregas/quitas artículos en el frontend, refleja el cambio aquí también
// para que las funciones de IA sigan proponiendo únicamente "keys" válidas.

export const CATALOG_ITEMS = [
  // mobiliario
  { key: "mostrador", name: "Mostrador / caja", category: "mobiliario", w: 1.5, d: 0.7, h: 1.0, cost: 8500 },
  { key: "vitrina", name: "Vitrina exhibidora", category: "mobiliario", w: 1.2, d: 0.6, h: 1.2, cost: 9200 },
  { key: "refrigerador", name: "Refrigerador vertical", category: "mobiliario", w: 0.9, d: 0.8, h: 2.0, cost: 22000 },
  { key: "congelador", name: "Congelador horizontal", category: "mobiliario", w: 1.8, d: 0.9, h: 0.95, cost: 26000 },
  { key: "mesa_espera", name: "Mesa / área de espera", category: "mobiliario", w: 1.0, d: 1.0, h: 0.75, cost: 3200 },
  { key: "silla", name: "Silla", category: "mobiliario", w: 0.5, d: 0.5, h: 0.9, cost: 650 },
  { key: "bano", name: "Sanitario", category: "mobiliario", w: 1.3, d: 1.3, h: 2.2, cost: 15000 },
  { key: "bodega", name: "Módulo de bodega/almacén", category: "mobiliario", w: 2.0, d: 1.5, h: 2.4, cost: 12000 },
  // racks
  { key: "rack_abarrotes", name: "Rack de abarrotes", category: "racks", w: 1.2, d: 0.5, h: 1.8, cost: 4800 },
  { key: "rack_bebidas", name: "Rack de bebidas", category: "racks", w: 1.2, d: 0.5, h: 1.8, cost: 4800 },
  { key: "rack_botanas", name: "Rack de botanas/snacks", category: "racks", w: 1.2, d: 0.5, h: 1.8, cost: 4600 },
  { key: "rack_farmacia", name: "Rack de farmacia", category: "racks", w: 1.0, d: 0.45, h: 1.8, cost: 6200 },
  { key: "rack_aseo", name: "Rack de aseo / limpieza", category: "racks", w: 1.2, d: 0.5, h: 1.8, cost: 4600 },
  { key: "rack_comida_prep", name: "Isla de comida preparada", category: "racks", w: 1.5, d: 0.9, h: 1.1, cost: 14500 },
  { key: "gondola_isla", name: "Góndola isla central", category: "racks", w: 1.8, d: 0.8, h: 1.5, cost: 9800 },
  { key: "canasta_promo", name: "Canasta / exhibidor de piso", category: "racks", w: 0.6, d: 0.6, h: 0.9, cost: 1800 },
  // servicios
  { key: "cajero", name: "Cajero automático", category: "servicios", w: 0.8, d: 0.7, h: 1.6, cost: 0 },
  { key: "pago_servicios", name: "Módulo de pago de servicios", category: "servicios", w: 1.0, d: 0.7, h: 1.1, cost: 3200 },
  { key: "recarga", name: "Módulo de recargas/telefonía", category: "servicios", w: 0.8, d: 0.6, h: 1.1, cost: 2400 },
  { key: "envios", name: "Punto de paquetería", category: "servicios", w: 1.2, d: 0.8, h: 1.1, cost: 3600 },
  { key: "cafe", name: "Estación de café / self-service", category: "servicios", w: 1.0, d: 0.6, h: 1.2, cost: 11000 },
];

export function catalogPromptBlock() {
  return CATALOG_ITEMS.map(
    (i) => `- ${i.key} | ${i.name} | ${i.w}x${i.d}m | categoría: ${i.category} | costo: $${i.cost}`
  ).join("\n");
}
