// Drizzle + libSQL (Turso) istemcisi. Üretimde Turso (hosted libSQL),
// yerel geliştirmede dosya tabanlı SQLite (data/vela.db) — ikisi de SQLite-uyumlu.
// Sadece sunucu tarafında import edilmeli (API route'lar / server action'lar).
//
// Üretim (Vercel): TURSO_DATABASE_URL + TURSO_AUTH_TOKEN ortam değişkenlerini ayarla.
// Yerel geliştirme: bu değişkenler boşsa otomatik "file:./data/vela.db" kullanılır
//   (Turso hesabı gerekmez). Vercel'de dosya sistemi efemer/salt-okunur olduğu için
//   üretimde mutlaka Turso URL'i ver.

import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Config } from "@libsql/client";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as schema from "./schema";

const TURSO_URL = process.env.TURSO_DATABASE_URL?.trim();
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN?.trim();

let config: Config;
if (TURSO_URL) {
  // Hosted libSQL (Turso) — üretim.
  config = { url: TURSO_URL, authToken: TURSO_TOKEN };
} else {
  // Yerel dosya fallback — geliştirme. Sadece bu modda data/ dizinini oluştur.
  const DATA_DIR = join(process.cwd(), "data");
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  config = { url: `file:${join(DATA_DIR, "vela.db")}` };
}

const client = createClient(config);

// Şemayı kod içinde garanti et (migration aracı olmadan da çalışsın).
// libSQL çoklu-ifade çalıştırmayı executeMultiple ile destekler.
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = client
      .executeMultiple(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT, name TEXT, plan TEXT DEFAULT 'free',
  risk_profile TEXT, stripe_customer_id TEXT, sub_status TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL,
  symbol TEXT NOT NULL, shares REAL NOT NULL, avg_cost REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT PRIMARY KEY, cash REAL NOT NULL DEFAULT 12480.55
);
CREATE TABLE IF NOT EXISTS phone_verifications (
  user_id TEXT PRIMARY KEY, phone TEXT NOT NULL, code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, ts INTEGER NOT NULL,
  side TEXT NOT NULL, symbol TEXT NOT NULL, shares REAL NOT NULL, price REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, symbol TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, rule TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', category TEXT NOT NULL DEFAULT 'Trading', last_run TEXT
);
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, symbol TEXT NOT NULL,
  condition TEXT NOT NULL, price REAL NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, ts INTEGER NOT NULL, messages TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_state (
  user_id TEXT PRIMARY KEY, blob TEXT NOT NULL, rev INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'side',
  title TEXT NOT NULL, detail TEXT, target_value REAL, currency TEXT DEFAULT 'USD',
  deadline INTEGER, risk_tolerance TEXT, status TEXT NOT NULL DEFAULT 'active',
  progress REAL NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS brain_settings (
  user_id TEXT PRIMARY KEY, authority TEXT NOT NULL DEFAULT 'advisory',
  kill_switch INTEGER NOT NULL DEFAULT 0, max_trade_pct REAL NOT NULL DEFAULT 5,
  max_daily_trades INTEGER NOT NULL DEFAULT 5, max_position_pct REAL NOT NULL DEFAULT 25,
  require_pin_over REAL DEFAULT 1000, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS decision_log (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, ts INTEGER NOT NULL, kind TEXT NOT NULL,
  action TEXT NOT NULL, rationale TEXT NOT NULL, goal_ref TEXT, authority TEXT,
  executed INTEGER NOT NULL DEFAULT 0, snapshot TEXT
);
CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_user ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_user ON memory(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE TABLE IF NOT EXISTS exchange_connections (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, exchange TEXT NOT NULL, label TEXT,
  environment TEXT NOT NULL DEFAULT 'testnet',
  api_key_enc TEXT NOT NULL, api_secret_enc TEXT NOT NULL,
  can_trade INTEGER NOT NULL DEFAULT 0, can_withdraw INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', last_check INTEGER, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS kyc (
  user_id TEXT PRIMARY KEY, full_name TEXT, birth_date TEXT, id_type TEXT,
  id_number TEXT, country TEXT, address TEXT, city TEXT, postal_code TEXT,
  doc_front TEXT, doc_back TEXT, status TEXT NOT NULL DEFAULT 'pending',
  submitted_at INTEGER, reviewed_at INTEGER
);
CREATE TABLE IF NOT EXISTS usage_daily (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, day TEXT NOT NULL,
  kind TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decision_user ON decision_log(user_id);
CREATE INDEX IF NOT EXISTS idx_exconn_user ON exchange_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_daily(user_id);
`)
      .then(() => migrateUserColumns())
      .catch((err) => {
        // Tekrar denenebilsin diye promise'i sıfırla.
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

/**
 * Eski users tablosuna sonradan eklenen kolonları güvenle ekle.
 * SQLite ADD COLUMN IF NOT EXISTS desteklemez → kolon varsa hata yutulur.
 */
async function migrateUserColumns(): Promise<void> {
  const adds = [
    "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
    "ALTER TABLE users ADD COLUMN sub_status TEXT",
    "ALTER TABLE users ADD COLUMN phone TEXT",
    "ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN paddle_customer_id TEXT",
    "ALTER TABLE users ADD COLUMN paddle_subscription_id TEXT",
    "ALTER TABLE kyc ADD COLUMN didit_session_id TEXT",
  ];
  for (const sql of adds) {
    try {
      await client.execute(sql);
    } catch {
      /* kolon zaten var */
    }
  }
}

/**
 * Şemanın hazır olduğunu garanti et. Repo fonksiyonları herhangi bir sorgu
 * öncesi await etmeli (libSQL async; better-sqlite3'teki senkron exec'in karşılığı).
 */
export const ready = ensureSchema;

export const db = drizzle(client, { schema });
export { schema };
