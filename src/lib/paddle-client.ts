// Paddle.js (client-side) yükleyici + overlay checkout açıcı.
// Sunucudan /api/billing/checkout ile alınan { priceId, clientToken, env, customData }
// kullanılarak Paddle.Checkout.open() çağrılır. Stripe gibi sayfa yönlendirmesi YOK;
// ödeme aynı sayfada overlay olarak açılır.

const PADDLE_JS_SRC = "https://cdn.paddle.com/paddle/v2/paddle.js";

type PaddleCheckoutOpen = (opts: {
  items: Array<{ priceId: string; quantity?: number }>;
  customer?: { email?: string };
  customData?: Record<string, unknown>;
  settings?: { displayMode?: "overlay" | "inline"; theme?: "light" | "dark"; successUrl?: string };
}) => void;

type PaddleGlobal = {
  Environment?: { set: (env: "sandbox" | "production") => void };
  Initialize: (opts: { token: string }) => void;
  Checkout: { open: PaddleCheckoutOpen };
};

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

let loadPromise: Promise<PaddleGlobal> | null = null;
let initializedToken: string | null = null;

/** Paddle.js script'ini bir kez yükle. */
function loadPaddleScript(): Promise<PaddleGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("Tarayıcı gerekli"));
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<PaddleGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PADDLE_JS_SRC}"]`);
    const onReady = () => {
      if (window.Paddle) resolve(window.Paddle);
      else reject(new Error("Paddle.js yüklenemedi"));
    };
    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("Paddle.js yüklenemedi")));
      return;
    }
    const s = document.createElement("script");
    s.src = PADDLE_JS_SRC;
    s.async = true;
    s.onload = onReady;
    s.onerror = () => reject(new Error("Paddle.js yüklenemedi"));
    document.head.appendChild(s);
  });
  return loadPromise;
}

/** Paddle'ı (gerekirse) yükle ve verilen token + ortamla başlat. */
async function ensurePaddle(clientToken: string, env: "sandbox" | "live"): Promise<PaddleGlobal> {
  const paddle = await loadPaddleScript();
  if (initializedToken !== clientToken) {
    if (env === "sandbox") paddle.Environment?.set("sandbox");
    paddle.Initialize({ token: clientToken });
    initializedToken = clientToken;
  }
  return paddle;
}

export type CheckoutConfig = {
  priceId: string;
  clientToken: string;
  env: "sandbox" | "live";
  email?: string;
  customData?: Record<string, unknown>;
};

/**
 * Plan için sunucudan checkout bilgisi al ve Paddle overlay'ini aç.
 * @returns hata mesajı (string) veya null (başarı/akış başladı).
 */
export async function startPaddleCheckout(plan: "pro" | "unlimited"): Promise<string | null> {
  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as
      | ({ ok: true } & CheckoutConfig)
      | { ok: false; error?: string };

    if (!data.ok) return data.error ?? "Ödeme başlatılamadı.";

    const paddle = await ensurePaddle(data.clientToken, data.env);
    paddle.Checkout.open({
      items: [{ priceId: data.priceId, quantity: 1 }],
      customer: data.email ? { email: data.email } : undefined,
      customData: data.customData,
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: `${window.location.origin}/dashboard/billing?success=1`,
      },
    });
    return null;
  } catch {
    return "Ödeme açılamadı. Lütfen tekrar dene.";
  }
}
