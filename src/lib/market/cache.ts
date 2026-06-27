// Basit, bağımsız (sıfır-bağımlılık) bellek-içi TTL önbelleği.
//
// Amaç: Finnhub ücretsiz katmanını (60 istek/dk) korumak. Birden çok kullanıcı
// veya çok-sembollü dashboard, her tarayıcı isteğinde upstream'e gitmek yerine
// burada tutulan taze değeri paylaşır.
//
// NOT: Bu önbellek PER-INSTANCE'tır (tek sunucu süreci/lambda örneği başına).
// Şimdilik yeterli; çok-örnekli (multi-instance) dağıtımda örnekler önbelleği
// paylaşmaz. Ölçeklenince Vercel KV / Redis gibi paylaşımlı bir store'a geçir.

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // unix ms
}

// Sınırsız büyümeyi engellemek için maksimum giriş sayısı. Aşılınca en eski
// (ekleme sırasına göre) giriş atılır — Map ekleme sırasını korur.
const MAX_ENTRIES = 500;

// Tüm önbellek tipleri için tek paylaşımlı store. Değerler heterojen olduğundan
// `unknown` tutulur; tip güvenliği `cached<T>()` jeneriği üzerinden sağlanır.
const store = new Map<string, CacheEntry<unknown>>();

// Aynı anahtar için uçuştaki (in-flight) istekleri tekilleştirir: aynı sembol
// için eşzamanlı 5 istek tek bir upstream çağrısına indirgenir.
const inflight = new Map<string, Promise<unknown>>();

function evictIfNeeded() {
  while (store.size > MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) break;
    store.delete(oldestKey);
  }
}

/**
 * Anahtar için taze (TTL içinde) değer varsa onu döner; yoksa `fetcher`'ı çağırıp
 * sonucu önbelleğe yazar ve döner. Eşzamanlı çağrılar tek upstream isteğinde
 * birleştirilir. fetcher hata atarsa hata yukarı fırlatılır (eski/yanlış değer
 * önbelleğe yazılmaz).
 *
 * @param key Önbellek anahtarı (ör. "quote:AAPL")
 * @param ttlSeconds Tazelik süresi (saniye)
 * @param fetcher Önbellek boş/bayatsa çağrılacak asenkron veri kaynağı
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  // Uçuştaki bir istek varsa ona katıl (thundering herd koruması).
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = (async () => {
    try {
      const value = await fetcher();
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      evictIfNeeded();
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Test/teşhis amaçlı: tüm önbelleği temizler. */
export function clearCache() {
  store.clear();
  inflight.clear();
}
