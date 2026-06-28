// Vela DB şeması — Drizzle + SQLite. Her satır Clerk userId'ye bağlı.
// Store'lar (portföy, watchlist, otomasyon, alarm, sohbet, hafıza) burada kalıcı olur.

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/** Kullanıcı profili — Clerk'ten gelen kimlikle eşlenir. */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Clerk userId
  email: text("email"),
  name: text("name"),
  plan: text("plan").default("free"),
  riskProfile: text("risk_profile"),
  stripeCustomerId: text("stripe_customer_id"), // (eski) Stripe müşteri kimliği
  paddleCustomerId: text("paddle_customer_id"), // Paddle müşteri kimliği
  paddleSubscriptionId: text("paddle_subscription_id"), // Paddle abonelik kimliği
  subStatus: text("sub_status"), // active | trialing | past_due | canceled | null
  phone: text("phone"), // E.164 doğrulanmış telefon
  phoneVerified: integer("phone_verified").default(0), // 0/1
  credits: integer("credits").default(0), // tek-seferlik kredi paketi bakiyesi (AI sohbet/araç havuzu)
  createdAt: integer("created_at").notNull(),
});

/**
 * Günlük kullanım sayacı — plan limitlerini (aiChatsPerDay vb.) enforce eder.
 * Anahtar: userId + day (YYYY-MM-DD UTC) + kind. Her gün doğal olarak sıfırlanır
 * (yeni gün = yeni satır). kind: "aiChat" | "webResearch" | ... genişletilebilir.
 */
export const usageDaily = sqliteTable("usage_daily", {
  id: text("id").primaryKey(), // `${userId}:${day}:${kind}`
  userId: text("user_id").notNull(),
  day: text("day").notNull(), // YYYY-MM-DD (UTC)
  kind: text("kind").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

/** Paper portföy holding'leri. */
export const holdings = sqliteTable("holdings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  shares: real("shares").notNull(),
  avgCost: real("avg_cost").notNull(),
});

/** Nakit + portföy meta (kullanıcı başına tek satır). */
export const accounts = sqliteTable("accounts", {
  userId: text("user_id").primaryKey(),
  cash: real("cash").notNull().default(12480.55),
});

/**
 * Telefon doğrulama kodları (Netgsm SMS). Twilio Verify'dan farklı: kodu biz
 * üretip burada HASH'li tutarız (düz kod ASLA saklanmaz), 5 dk geçerli, deneme
 * sayısı sınırlı (brute-force koruması). Kullanıcı başına tek aktif kayıt.
 */
export const phoneVerifications = sqliteTable("phone_verifications", {
  userId: text("user_id").primaryKey(),
  phone: text("phone").notNull(), // E.164
  codeHash: text("code_hash").notNull(), // sha256(code + userId)
  expiresAt: integer("expires_at").notNull(), // epoch ms
  attempts: integer("attempts").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

/** Emir geçmişi. */
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  ts: integer("ts").notNull(),
  side: text("side").notNull(),
  symbol: text("symbol").notNull(),
  shares: real("shares").notNull(),
  price: real("price").notNull(),
});

/** Watchlist sembolleri. */
export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
});

/** Otomasyon ajanları. */
export const automations = sqliteTable("automations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  rule: text("rule").notNull(),
  status: text("status").notNull().default("active"),
  category: text("category").notNull().default("Trading"),
  lastRun: text("last_run"),
});

/** Fiyat alarmları. */
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  condition: text("condition").notNull(),
  price: real("price").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at").notNull(),
});

/** AI uzun-dönem hafıza gerçekleri. */
export const memory = sqliteTable("memory", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: integer("created_at").notNull(),
});

/** Sohbet geçmişi (JSON serialized messages). */
export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  ts: integer("ts").notNull(),
  messages: text("messages").notNull(), // JSON string
});

/**
 * Kullanıcının tüm client-store durumunun tek-satır JSON yedeği (snapshot).
 * Köprü stratejisi: localStorage anlık+offline kalır, bu tablo cihazlar-arası
 * kalıcılık + gerçek-ürün temeli sağlar. Granüler tablolar (holdings/orders…)
 * analitik/sorgu için ileride doldurulur.
 */
export const userState = sqliteTable("user_state", {
  userId: text("user_id").primaryKey(),
  blob: text("blob").notNull(), // JSON: { [storeKey]: value }
  rev: integer("rev").notNull().default(0), // sürüm — son-yazan kazanır + çakışma tespiti
  updatedAt: integer("updated_at").notNull(),
});

/** Hedefler — ana + yan; AI'nın pusulası (Blok 2). */
export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull().default("side"), // "main" | "side"
  title: text("title").notNull(),
  detail: text("detail"),
  targetValue: real("target_value"), // hedef tutar (ör. 10000)
  currency: text("currency").default("USD"),
  deadline: integer("deadline"), // epoch ms
  riskTolerance: text("risk_tolerance"), // low|medium|high
  status: text("status").notNull().default("active"), // active|paused|done
  progress: real("progress").notNull().default(0), // 0..100
  createdAt: integer("created_at").notNull(),
});

/** Vela Brain ayarları — yetki + güven bütçesi + kill switch (Blok 3). */
export const brainSettings = sqliteTable("brain_settings", {
  userId: text("user_id").primaryKey(),
  authority: text("authority").notNull().default("advisory"), // full|semi|advisory
  killSwitch: integer("kill_switch").notNull().default(0), // 1 = tüm otonom durdu
  maxTradePct: real("max_trade_pct").notNull().default(5), // tek işlemde portföyün max %'si
  maxDailyTrades: integer("max_daily_trades").notNull().default(5),
  maxPositionPct: real("max_position_pct").notNull().default(25), // tek varlık max ağırlık
  requirePinOver: real("require_pin_over").default(1000), // bu tutar üstü işlemde PIN
  updatedAt: integer("updated_at").notNull(),
});

/** AI Karar Defteri — her otonom/önerilen aksiyon + gerekçe + o anki veri (Blok 3). */
export const decisionLog = sqliteTable("decision_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  ts: integer("ts").notNull(),
  kind: text("kind").notNull(), // trade|rebalance|alert|insight|blocked
  action: text("action").notNull(), // insan-okur özet
  rationale: text("rationale").notNull(), // NEDEN
  goalRef: text("goal_ref"), // hangi hedefe bağlı
  authority: text("authority"), // o anki yetki seviyesi
  executed: integer("executed").notNull().default(0), // 1 uygulandı / 0 öneri-bekliyor
  snapshot: text("snapshot"), // JSON: o anki ilgili veri (fiyat/skor vs.)
});

/**
 * Borsa/aracı kurum bağlantıları — kullanıcının KENDİ hesabına non-custodial
 * erişim. API anahtarları ASLA düz metin saklanmaz: AES-256-GCM ile şifrelenir
 * (apiKeyEnc/apiSecretEnc = iv:authTag:ciphertext, base64). Para çekme yetkisi
 * önerilmez; izin kapsamı kullanıcıya gösterilir. Finovela parayı tutmaz.
 */
export const exchangeConnections = sqliteTable("exchange_connections", {
  id: text("id").primaryKey(), // `${userId}:${exchange}`
  userId: text("user_id").notNull(),
  exchange: text("exchange").notNull(), // "binance" | "alpaca" | ...
  label: text("label"), // kullanıcının verdiği ad (ops.)
  environment: text("environment").notNull().default("testnet"), // testnet | live
  apiKeyEnc: text("api_key_enc").notNull(), // şifreli
  apiSecretEnc: text("api_secret_enc").notNull(), // şifreli
  canTrade: integer("can_trade").notNull().default(0), // doğrulamada saptanan izinler
  canWithdraw: integer("can_withdraw").notNull().default(0), // 1 ise kullanıcı uyarılır
  status: text("status").notNull().default("active"), // active | error | revoked
  lastCheck: integer("last_check"), // son doğrulama epoch ms
  createdAt: integer("created_at").notNull(),
});

/**
 * KYC (kimlik doğrulama) kayıtları — yatırım platformu zorunluluğu.
 * Belgeler toplanır; gerçek doğrulama 3. parti KYC servisine (Onfido/Sumsub)
 * bağlanabilir. Şimdilik durum: pending → verified/rejected (manuel/otomatik).
 * Hassas alanlar gerektiğinde şifrelenebilir; belge dosyası harici depoda tutulur.
 */
export const kyc = sqliteTable("kyc", {
  userId: text("user_id").primaryKey(),
  fullName: text("full_name"),
  birthDate: text("birth_date"), // YYYY-MM-DD
  idType: text("id_type"), // tc | passport | other
  idNumber: text("id_number"),
  country: text("country"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  docFront: text("doc_front"), // belge referansı (data URL / harici depo anahtarı)
  docBack: text("doc_back"),
  status: text("status").notNull().default("pending"), // pending | verified | rejected
  diditSessionId: text("didit_session_id"), // Didit doğrulama oturumu (webhook eşleştirme)
  submittedAt: integer("submitted_at"),
  reviewedAt: integer("reviewed_at"),
});

export type DbUser = typeof users.$inferSelect;
export type DbGoal = typeof goals.$inferSelect;
export type DbBrainSettings = typeof brainSettings.$inferSelect;
export type DbDecision = typeof decisionLog.$inferSelect;
export type DbExchangeConnection = typeof exchangeConnections.$inferSelect;
export type DbKyc = typeof kyc.$inferSelect;
