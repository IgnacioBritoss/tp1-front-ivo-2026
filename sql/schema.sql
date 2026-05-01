-- las tablas 
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);


CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  boletas_jugadas INT DEFAULT 0,
  dinero_gastado BIGINT DEFAULT 0,
  dinero_ganado BIGINT DEFAULT 0,
  frecuencia_2_cifras JSONB DEFAULT '[]'::jsonb,
  frecuencia_3_cifras JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de boletas jugadas por cada usuario
CREATE TABLE IF NOT EXISTS boletas (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jugadas JSONB NOT NULL,
  sorteos JSONB NOT NULL,
  cantidad_sorteos INT NOT NULL,
  costo_total BIGINT NOT NULL,
  premio_total BIGINT NOT NULL,
  aciertos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boletas_user_created
  ON boletas(user_id, created_at DESC);

-- Jugada favorita del usuario
CREATE TABLE IF NOT EXISTS jugada_favorita (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT DEFAULT 'Mi jugada favorita',
  jugadas JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);