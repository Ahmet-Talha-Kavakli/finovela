# Vela — Büyük Vizyon Yol Haritası

> Tarih: 2026-06-24 · Amaç: rakipleri (RockFlow, Public, eToro) yakalamak DEĞİL,
> onların aklına gelmeyeni yapıp **kategori lideri** olmak.
> Onaylı vizyon (kullanıcı: "hepsini detaylıca yapalım").

## Kuzey Yıldızı
Vela = **uyumayan, hedefe-bağlı, açıklanabilir otonom portföy yöneticisi.**
Rakiplerin AI'sı sorulunca cevap verir; Vela Brain arka planda sürekli çalışır,
hedefe göre karar verir, her kararının nedenini kayıt altına alır, ve kullanıcının
verdiği yetki/güven sınırları içinde hareket eder.

---

## FARKLILAŞTIRICI BÜYÜK FİKİRLER (rakiplerde yok)

1. **Vela Brain** — otonom portföy işletim sistemi. Yetki seviyesi (tam/yarım/yetkisiz)
   + güven bütçesi (işlem başı/günlük limit) + kill switch. Hedefe bağlı sürekli tarama.
2. **What-If Simülasyon Stüdyosu** — karar öncesi gelecek senaryoları (Monte Carlo:
   iyimser/baz/kötümser), "bu işlemi yaparsam 1 ay/1 yıl sonra ne olur".
3. **Vela Skoru** — her varlığa 0-100 sağlık skoru (değerleme+momentum+sentiment+
   temettü güvenliği+bilanço) + **erken uyarı radarı** (skor düşerse sen sormadan uyarır).
4. **Doğal dil backtest + strateji klonlama** — "2020 çöküşünde ne yapardı" → backtest →
   "bunu otomatiğe al" tek akış.
5. **Vela Pulse** — sadece senin portföyüne/hedefine özel canlı istihbarat akışı.
6. **Açıklanabilir Güven Katmanı** — AI Karar Defteri (her aksiyon+gerekçe+veri),
   kill switch, güven bütçesi. "Tam yetki"yi satılabilir yapan şey.

---

## YAPIM SIRASI (her blok bittiğinde kullanıcıya göster)

### Blok 1 — TEMEL: Gerçek Kalıcılık
- localStorage store'ları DB ile senkronize et (Drizzle/SQLite hazır).
- Clerk userId'ye bağla; cihazlar arası kalıcı portföy/watchlist/otomasyon/sohbet.
- Strateji: localStorage anlık kalır (offline+hız), arka planda DB'ye yaz + ilk yükte hidrate.

### Blok 2 — Hedefler Sistemi
- Ana hedef + yan hedefler, çakışma çözümü. AI'nın pusulası.
- DB'de saklı; sistem prompt'a enjekte → her AI kararı hedefe bağlı.

### Blok 3 — Vela Brain (agentic çekirdek)
- Yetki seviyeleri: tam (onaysız uygular), yarım (son işlemde onay), yetkisiz (öneri).
- Güven bütçesi: işlem başı max %, günlük max işlem, varlık başı limit.
- Kill switch: tek tık tüm otonomu durdur.
- AI Karar Defteri: her aksiyon + gerekçe + o anki veri (audit log).

### Blok 4 — AI Güçlendirme
- Yeni indikatör tool'ları: MACD, Bollinger, ATR (RSI zaten var) + VIX/Fear-Greed.
- Persistent memory (oturumlar arası, DB'de).
- Sesle işlem (Web Speech → komut → tool).
- What-If simülasyon tool'u.

### Blok 5 — Gerçekleştirme (fake → gerçek)
- Gerçek backtest motoru (Strategy Builder canlandır) + doğal dil backtest.
- Options gerçek pozisyon (Confirm → store'a yazsın).
- Gelişmiş emir tipleri zaten store'da var (trailing/OCO/take-profit) → UI'a tam bağla.
- Earn/Cash gerçek APY birikimi, Bonds, Tax-loss harvesting.
- Vela Skoru + erken uyarı.
- Vela Pulse akışı.

### Blok 6 — Bağlantılar & Güvenlik
- Bağlantılar sayfası: broker (Alpaca paper→live), banka, cüzdan entegrasyon merkezi.
- Güvenlik kiti: Clerk üstü 2FA/yedek kod/cihaz/mail + Cloudflare Turnstile + işlem PIN.

### Blok 7 — Canlı Veri
- WebSocket stream (Finnhub/Alpaca) → gecikmeli veri fix, saniyelik tik.

### Blok 8 — Üst-Kalite Görsel
- Framer Motion sayfa geçişleri, sayı sayaç animasyonu, grafik çizim animasyonu,
  micro-interactions, skeleton loader'lar.
