-- Esquema para el Parametrizador de Unidades de Venta Minorista
-- Ejecutar con:
--   wrangler d1 execute parametrizador-db --remote --file=./schema.sql
-- (usa --local en vez de --remote si primero quieres probar en tu máquina)

CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  thumb      TEXT,
  state      TEXT NOT NULL          -- JSON serializado: mobiliario, muros, pasillos, plano de referencia, etc.
);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects (updated_at DESC);
