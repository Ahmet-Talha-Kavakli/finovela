// Vela DB repository — sunucu tarafı veri erişimi. Sadece API route'lardan çağır.
// user_state (client-store JSON yedeği), goals, brain_settings, decision_log.
//
// NOT: Sürücü libSQL'e (Turso) taşındı; tüm sorgular ASENKRON. Fonksiyonlar
// Promise döndürür — çağıranlar await etmeli.

import { eq, desc } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db, schema, ready } from "./index";

const { users, userState, goals, brainSettings, decisionLog, exchangeConnections, kyc, phoneVerifications } = schema;

// ── phone_verifications: SMS kod doğrulama (Netgsm) ───────────────────────────

/** Kodu düz saklamayız — userId tuzlu sha256 hash'i. */
function hashCode(code: string, userId: string): string {
  return createHash("sha256").update(`${code}:${userId}`).digest("hex");
}

/** Yeni doğrulama kodu kaydet (eski kaydı ezer). expiresAt: epoch ms. */
export async function savePhoneCode(
  userId: string,
  phone: string,
  code: string,
  expiresAt: number,
  now: number,
) {
  await ready();
  await db
    .insert(phoneVerifications)
    .values({ userId, phone, codeHash: hashCode(code, userId), expiresAt, attempts: 0, createdAt: now })
    .onConflictDoUpdate({
      target: phoneVerifications.userId,
      set: { phone, codeHash: hashCode(code, userId), expiresAt, attempts: 0, createdAt: now },
    })
    .run();
}

/**
 * Girilen kodu doğrula. Süre/deneme kontrolü dahil.
 * Dönüş: "ok" | "expired" | "too_many" | "wrong" | "none"
 */
export async function checkPhoneCode(
  userId: string,
  code: string,
  now: number,
): Promise<{ result: "ok" | "expired" | "too_many" | "wrong" | "none"; phone?: string }> {
  await ready();
  const row = await db
    .select()
    .from(phoneVerifications)
    .where(eq(phoneVerifications.userId, userId))
    .get();
  if (!row) return { result: "none" };
  if (now > row.expiresAt) return { result: "expired" };
  if (row.attempts >= 5) return { result: "too_many" };

  if (row.codeHash !== hashCode(code, userId)) {
    await db
      .update(phoneVerifications)
      .set({ attempts: row.attempts + 1 })
      .where(eq(phoneVerifications.userId, userId))
      .run();
    return { result: "wrong" };
  }
  // Doğru → kaydı temizle (tek kullanımlık).
  await db.delete(phoneVerifications).where(eq(phoneVerifications.userId, userId)).run();
  return { result: "ok", phone: row.phone };
}

// ── kyc: kimlik doğrulama ─────────────────────────────────────────────────────

export type KycInput = {
  userId: string;
  fullName?: string | null;
  birthDate?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  country?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  docFront?: string | null;
  docBack?: string | null;
};

export async function getKyc(userId: string) {
  await ready();
  return db.select().from(kyc).where(eq(kyc.userId, userId)).get();
}

/** KYC başvurusu kaydet → durum 'pending' (inceleniyor). */
export async function submitKyc(input: KycInput) {
  await ready();
  const existing = await db.select().from(kyc).where(eq(kyc.userId, input.userId)).get();
  const row = {
    userId: input.userId,
    fullName: input.fullName ?? null,
    birthDate: input.birthDate ?? null,
    idType: input.idType ?? null,
    idNumber: input.idNumber ?? null,
    country: input.country ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    postalCode: input.postalCode ?? null,
    docFront: input.docFront ?? null,
    docBack: input.docBack ?? null,
    status: "pending" as const,
    submittedAt: Date.now(),
    reviewedAt: null,
  };
  if (existing) {
    await db.update(kyc).set(row).where(eq(kyc.userId, input.userId)).run();
  } else {
    await db.insert(kyc).values(row).run();
  }
  return row;
}

export async function setKycStatus(userId: string, status: "verified" | "rejected") {
  await ready();
  await db.update(kyc).set({ status, reviewedAt: Date.now() }).where(eq(kyc.userId, userId)).run();
}

/**
 * Didit doğrulama oturumu başlat — kyc satırını 'pending' yapıp session id'yi sakla.
 * (Webhook geldiğinde userId vendor_data ile, session_id ile eşleşir.)
 */
export async function startDiditKyc(userId: string, sessionId: string) {
  await ready();
  const existing = await db.select().from(kyc).where(eq(kyc.userId, userId)).get();
  if (existing) {
    await db
      .update(kyc)
      .set({ status: "pending", diditSessionId: sessionId, submittedAt: Date.now(), reviewedAt: null })
      .where(eq(kyc.userId, userId))
      .run();
  } else {
    await db
      .insert(kyc)
      .values({ userId, status: "pending", diditSessionId: sessionId, submittedAt: Date.now() })
      .run();
  }
}

/** Didit webhook → status eşle. Didit durumları: Approved/Declined/In Review/... */
export async function applyDiditStatus(userId: string, diditStatus: string) {
  await ready();
  const s = diditStatus.toLowerCase();
  const status: "verified" | "rejected" | "pending" =
    s === "approved" ? "verified" : s === "declined" || s === "expired" || s === "abandoned" ? "rejected" : "pending";
  await db
    .update(kyc)
    .set({ status, reviewedAt: status === "pending" ? null : Date.now() })
    .where(eq(kyc.userId, userId))
    .run();
  return status;
}

// ── exchange_connections: borsa/aracı kurum bağlantıları ──────────────────────

export type ExchangeConnInput = {
  userId: string;
  exchange: string;
  label?: string | null;
  environment: string; // testnet | live
  apiKeyEnc: string;
  apiSecretEnc: string;
  canTrade: number;
  canWithdraw: number;
};

/** Bağlantıyı oluştur/güncelle (kullanıcı başına borsa başına tek satır). */
export async function upsertExchangeConnection(c: ExchangeConnInput) {
  await ready();
  const id = `${c.userId}:${c.exchange}`;
  const existing = await db.select().from(exchangeConnections).where(eq(exchangeConnections.id, id)).get();
  const row = {
    id,
    userId: c.userId,
    exchange: c.exchange,
    label: c.label ?? null,
    environment: c.environment,
    apiKeyEnc: c.apiKeyEnc,
    apiSecretEnc: c.apiSecretEnc,
    canTrade: c.canTrade,
    canWithdraw: c.canWithdraw,
    status: "active",
    lastCheck: Date.now(),
    createdAt: existing?.createdAt ?? Date.now(),
  };
  if (existing) {
    await db.update(exchangeConnections).set(row).where(eq(exchangeConnections.id, id)).run();
  } else {
    await db.insert(exchangeConnections).values(row).run();
  }
  return row;
}

/** Kullanıcının tüm bağlantıları (şifreli anahtarlar dahil — yalnızca sunucuda). */
export async function listExchangeConnections(userId: string) {
  await ready();
  return db.select().from(exchangeConnections).where(eq(exchangeConnections.userId, userId)).all();
}

/** Tek bağlantı (emir göndermek için anahtarlarla). */
export async function getExchangeConnection(userId: string, exchange: string) {
  await ready();
  return db
    .select()
    .from(exchangeConnections)
    .where(eq(exchangeConnections.id, `${userId}:${exchange}`))
    .get();
}

export async function deleteExchangeConnection(userId: string, exchange: string) {
  await ready();
  await db.delete(exchangeConnections).where(eq(exchangeConnections.id, `${userId}:${exchange}`)).run();
}

// ── users: Clerk kimliğine bağlı kullanıcı kaydı ──────────────────────────────

export type UpsertUserInput = {
  id: string; // Clerk userId
  email?: string | null;
  name?: string | null;
};

/**
 * Kullanıcıyı oluştur veya güncelle (idempotent). Dashboard'a ilk girişte
 * sunucu tarafından çağrılır — webhook gerektirmez. plan/riskProfile yalnızca
 * yoksa varsayılan alır; var olan değerler korunur.
 */
export async function upsertUser(u: UpsertUserInput) {
  await ready();
  const existing = await db.select().from(users).where(eq(users.id, u.id)).get();
  if (existing) {
    // Sadece email/name tazele (plan & riskProfile'a dokunma).
    await db
      .update(users)
      .set({ email: u.email ?? existing.email, name: u.name ?? existing.name })
      .where(eq(users.id, u.id))
      .run();
    return existing;
  }
  const row = {
    id: u.id,
    email: u.email ?? null,
    name: u.name ?? null,
    plan: "Free", // yeni kullanıcı varsayılanı (ücretsiz paket)
    riskProfile: null,
    createdAt: Date.now(),
  };
  await db.insert(users).values(row).run();
  return row;
}

export async function getUserRow(userId: string) {
  await ready();
  return db.select().from(users).where(eq(users.id, userId)).get();
}

export async function setUserPlan(userId: string, plan: string) {
  await ready();
  await db.update(users).set({ plan }).where(eq(users.id, userId)).run();
}

/** Doğrulanmış telefonu kaydet (Twilio Verify onayı sonrası). */
export async function setUserPhone(userId: string, phone: string) {
  await ready();
  await db.update(users).set({ phone, phoneVerified: 1 }).where(eq(users.id, userId)).run();
}

/** Stripe customer ID'sini kaydet (checkout sırasında). */
export async function setStripeCustomer(userId: string, stripeCustomerId: string) {
  await ready();
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).run();
}

/** Stripe customer ID'sinden kullanıcıyı bul (webhook'ta). */
export async function getUserByStripeCustomer(stripeCustomerId: string) {
  await ready();
  return db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).get();
}

/** Abonelik durumu + plan'ı birlikte güncelle (webhook'ta). */
export async function setUserSubscription(userId: string, plan: string, subStatus: string | null) {
  await ready();
  await db.update(users).set({ plan, subStatus }).where(eq(users.id, userId)).run();
}

// ── user_state: tüm client-store'ların tek-satır JSON yedeği ──────────────────

export type StateBlob = Record<string, unknown>;

export async function getState(
  userId: string,
): Promise<{ blob: StateBlob; rev: number } | null> {
  await ready();
  const row = await db.select().from(userState).where(eq(userState.userId, userId)).get();
  if (!row) return null;
  try {
    return { blob: JSON.parse(row.blob) as StateBlob, rev: row.rev };
  } catch {
    return { blob: {}, rev: row.rev };
  }
}

/**
 * Durumu kaydet. Son-yazan-kazanır + rev artışı. clientRev verilirse ve sunucu
 * revi daha yeniyse çakışma bildirir (client güncel veriyi alıp birleştirir).
 */
export async function putState(
  userId: string,
  blob: StateBlob,
  ts: number,
  clientRev?: number,
): Promise<{ rev: number; conflict: boolean; server?: StateBlob }> {
  await ready();
  const existing = await db.select().from(userState).where(eq(userState.userId, userId)).get();
  if (existing && clientRev != null && existing.rev > clientRev) {
    // Sunucu daha yeni — çakışma. Sunucu durumunu döndür (client birleştirir).
    let server: StateBlob = {};
    try {
      server = JSON.parse(existing.blob) as StateBlob;
    } catch {
      /* ignore */
    }
    return { rev: existing.rev, conflict: true, server };
  }
  const nextRev = (existing?.rev ?? 0) + 1;
  const json = JSON.stringify(blob);
  if (existing) {
    await db.update(userState)
      .set({ blob: json, rev: nextRev, updatedAt: ts })
      .where(eq(userState.userId, userId))
      .run();
  } else {
    await db.insert(userState).values({ userId, blob: json, rev: nextRev, updatedAt: ts }).run();
  }
  return { rev: nextRev, conflict: false };
}

// ── goals ─────────────────────────────────────────────────────────────────────

export type GoalInput = {
  id: string;
  kind?: string;
  title: string;
  detail?: string | null;
  targetValue?: number | null;
  currency?: string;
  deadline?: number | null;
  riskTolerance?: string | null;
  status?: string;
  progress?: number;
  createdAt: number;
};

export async function listGoals(userId: string) {
  await ready();
  return db.select().from(goals).where(eq(goals.userId, userId)).all();
}

export async function upsertGoal(userId: string, g: GoalInput) {
  await ready();
  const existing = await db.select().from(goals).where(eq(goals.id, g.id)).get();
  const row = {
    id: g.id,
    userId,
    kind: g.kind ?? "side",
    title: g.title,
    detail: g.detail ?? null,
    targetValue: g.targetValue ?? null,
    currency: g.currency ?? "USD",
    deadline: g.deadline ?? null,
    riskTolerance: g.riskTolerance ?? null,
    status: g.status ?? "active",
    progress: g.progress ?? 0,
    createdAt: g.createdAt,
  };
  if (existing) {
    await db.update(goals).set(row).where(eq(goals.id, g.id)).run();
  } else {
    await db.insert(goals).values(row).run();
  }
  return row;
}

export async function deleteGoal(userId: string, id: string) {
  await ready();
  await db.delete(goals).where(eq(goals.id, id)).run();
}

// ── brain_settings ─────────────────────────────────────────────────────────────

const DEFAULT_BRAIN = {
  authority: "advisory" as const,
  killSwitch: 0,
  maxTradePct: 5,
  maxDailyTrades: 5,
  maxPositionPct: 25,
  requirePinOver: 1000,
};

export async function getBrain(userId: string) {
  await ready();
  const row = await db.select().from(brainSettings).where(eq(brainSettings.userId, userId)).get();
  if (!row) return { userId, ...DEFAULT_BRAIN, updatedAt: 0 };
  return row;
}

export async function putBrain(
  userId: string,
  patch: Partial<typeof DEFAULT_BRAIN>,
  ts: number,
) {
  await ready();
  const existing = await db.select().from(brainSettings).where(eq(brainSettings.userId, userId)).get();
  const merged = {
    userId,
    authority: patch.authority ?? existing?.authority ?? DEFAULT_BRAIN.authority,
    killSwitch: patch.killSwitch ?? existing?.killSwitch ?? DEFAULT_BRAIN.killSwitch,
    maxTradePct: patch.maxTradePct ?? existing?.maxTradePct ?? DEFAULT_BRAIN.maxTradePct,
    maxDailyTrades: patch.maxDailyTrades ?? existing?.maxDailyTrades ?? DEFAULT_BRAIN.maxDailyTrades,
    maxPositionPct: patch.maxPositionPct ?? existing?.maxPositionPct ?? DEFAULT_BRAIN.maxPositionPct,
    requirePinOver: patch.requirePinOver ?? existing?.requirePinOver ?? DEFAULT_BRAIN.requirePinOver,
    updatedAt: ts,
  };
  if (existing) {
    await db.update(brainSettings).set(merged).where(eq(brainSettings.userId, userId)).run();
  } else {
    await db.insert(brainSettings).values(merged).run();
  }
  return merged;
}

// ── decision_log ────────────────────────────────────────────────────────────────

export type DecisionInput = {
  id: string;
  ts: number;
  kind: string;
  action: string;
  rationale: string;
  goalRef?: string | null;
  authority?: string | null;
  executed?: number;
  snapshot?: string | null;
};

export async function listDecisions(userId: string, limit = 100) {
  await ready();
  return db
    .select()
    .from(decisionLog)
    .where(eq(decisionLog.userId, userId))
    .orderBy(desc(decisionLog.ts))
    .limit(limit)
    .all();
}

/** Bugün (00:00'dan beri) gerçekleşen işlem (trade) sayısı — günlük limit için. */
export async function countTodaysTrades(userId: string): Promise<number> {
  await ready();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const rows = await db
    .select()
    .from(decisionLog)
    .where(eq(decisionLog.userId, userId))
    .all();
  return rows.filter((r) => r.kind === "trade" && r.executed === 1 && r.ts >= startMs).length;
}

export async function addDecision(userId: string, d: DecisionInput) {
  await ready();
  await db.insert(decisionLog)
    .values({
      id: d.id,
      userId,
      ts: d.ts,
      kind: d.kind,
      action: d.action,
      rationale: d.rationale,
      goalRef: d.goalRef ?? null,
      authority: d.authority ?? null,
      executed: d.executed ?? 0,
      snapshot: d.snapshot ?? null,
    })
    .run();
}
