# Vela — Kapsamlı Özellik Envanteri & Rakip Karşılaştırması (Gap Analysis)

> Tarih: 2026-06-24 · Rakipler: **RockFlow/Bobby**, **Public.com**, **eToro**
> Amaç: Bizde ne var (çalışan/UI-only), rakiplerde ne var, **bizde ne eksik** — sonra ekleyeceğiz.

**Durum etiketleri:** `✅ ÇALIŞIYOR` · `🟡 KISMİ` · `⬜ SADECE-UI` · `🔢 MOCK-VERİ` · `❌ YOK`

---

## BÖLÜM 1 — VELA: Şu An Sunduğumuz Her Şey

### A. Landing / Pazarlama (büyük oranda statik)
| Sayfa | Durum | Not |
|---|---|---|
| Ana sayfa (9 bölüm) | ⬜ | Hero, AiNative, NoExpertise, UseCases, AiPortfolios, Outsmarts, MadeNatural, Testimonials, FinalCta |
| Pricing | ⬜ | 3 tier (Free/Pro $12/Wealth %0.25), karşılaştırma tablosu, FAQ açılır ✅ |
| product/ai · portfolio · strategy · tax | ⬜ | Tamamı statik mockup |
| markets · markets/stocks | 🔢 | Hardcoded kartlar, hepsi `/app`'e gidiyor |
| research · academy · blog · copy · automation · download | ⬜ | Statik |
| support | 🟡 | mailto çalışıyor, FAQ ✅ |
| app (kayıt) | 🟡 | Google/Apple butonları ölü; "Create free account" → onboarding |

**Pazarlama eksikleri:** ölü linkler (`/about`, `/contact`, `/legal/terms`, sosyaller `#`, blog yazıları yok), fiyatta aylık/yıllık toggle yok, `hot-stocks` (tek canlı bileşen) hiç mount edilmemiş.

### B. Dashboard
| Sayfa | Durum | Detay |
|---|---|---|
| Overview | 🟡 | Canlı toplam değer/holding/dağılım; **zaman aralığı pill'leri (1G/1H/1A/1Y) ölü**; günlük brifing 4 sabit metin |
| Vela Chat | ✅ | Gerçek streaming Claude — aşağıda C |
| Portfolio | 🟡 | Canlı özet/holding tablosu/**gerçek risk göstergesi**; perf grafiği sentetik |
| Smart Portfolios (+detay) | 🔢 | 8 hazır sepet; **"Invest" butonu ölü** |
| Markets | ✅ | Canlı quote (tüm evren), canlı arama, gainers/losers; **endeks kartları hardcoded** |
| Stock Detail | ✅ | Canlı quote+haber, watchlist yıldızı, gerçek candle grafik, **TradePanel (gerçek paper trade)** |
| Research | 🟡 | **"Ask Vela" kutusu ölü**; haber/earnings/analist hepsi mock |
| Strategy Builder | ⬜ | **Backtest & Deploy butonları çalışmıyor** |
| Alerts | ✅ | Gerçek CRUD + motor 20sn'de bir tetikliyor |
| Automation | 🟡 | Doğal dil → kural; **stop/buydip/RSI gerçekten yürütülüyor**; "hacim $4,200" hardcoded |
| Copy (leaderboard+profil) | 🟡 | **"Start copying" gerçek paper alım yapıyor**; stop-loss toplanıyor ama uygulanmıyor |
| Earn | 🔢 | Hepsi hardcoded; "Move cash" ölü |
| Earnings | 🟡 | Listeler hardcoded; **"Preview/Recap" gerçek AI çağırıyor** |
| Feed | 🔢 | 8 seed post, beğeni local; **yorum/repost/follow ölü** |
| Options | 🟡 | **Gerçek Black-Scholes** zincir + strateji kurucu + payoff; **"Confirm" sadece bildirim, gerçek pozisyon yok** |
| Onboarding | 🟡 | 4 adım validasyon var ama **hiçbir şey kaydolmuyor** |
| Settings | ⬜ | Tüm toggle'lar dekoratif |

### C. AI (en güçlü yanımız) ✅
Claude opus-4-8, SSE streaming, **14 tool'lu tool-use döngüsü**, prompt caching, **canlı portföy enjeksiyonu** (AI holdinglerini biliyor), **kalıcı çoklu sohbet geçmişi** + Haiku auto-title, locale algılama, zengin kartlar (quote/order/rebalance/automation — tıkla-uygula). Mikrofon **dekoratif** (ses yok).
**Tool'lar:** get_quote, get_company_profile, get_news, search_symbols, propose_order, rebalance_portfolio, create_automation, deploy_strategy, add/remove_watchlist, create_alert, start_copy, navigate.

### D. Backend / Veri
Finnhub + Anthropic gerçek; **ama veri varsayılan SENTETİK** (mock provider). DB yok, auth yok, ödeme yok, sunucu-bildirim/email/push yok. Her şey localStorage.

### E. Store'lar & Motorlar ✅
paper-store (gerçek alım/satım), use-portfolio (gerçek risk skoru 1-10), alert engine (20sn poll → alarm+otomasyon yürütme), automations (stop/buydip/RSI parse+exec), indicators (RSI/EMA/SMA — sadece RSI bağlı), watchlist, notifications, chats. **Kalıcı:** portföy, emirler, alarmlar, otomasyonlar, watchlist, bildirimler, sohbetler.

---

## BÖLÜM 2 — Rakip Özellik Birleşimi (3 rakibin TÜM özellikleri)

### Trading & Emir Tipleri
- Limit, stop-loss, take-profit, **trailing stop-loss**, **conditional/OCO orders**, target-price otomasyonu
- **Voice trading** (RockFlow, <0.5s) — sesle al/sat/stop-loss
- **Options L1–L4** (Public): covered call, cash-secured put, long call/put, straddle, strangle, collar, spread, butterfly, condor, naked; **multi-leg tek emir**, **rolling tool**
- **Options rebate** $0.06–0.18/kontrat (Public — sektörde tek)
- **Margin trading** (kaldıraç, faiz oranları, risk-rate dashboard Safe/Warning/Danger)
- **Short selling**
- **Extended/pre-market & after-hours**, **24/5 trading** (eToro), **spot-quoted futures** (eToro+CME)
- **Trading API** (Public, eToro Builders Portal) — programatik emir
- **Queue** — toplu/aşamalı emir (Public)
- **Baby Bull / Baby Bear** — paketlenmiş basit opsiyon (RockFlow)

### Varlık Sınıfları
- Hisse + **fractional ($1)**, ETF, **Options**, **Spot Crypto** (40–200+ coin), **Bonds** (10k+ bireysel + Bond Screener), **US Treasuries + ladder**, **Gold/commodities**, **CFD** (eToro Intl), **müzik royalty / sanat (alts)**, **tokenized stocks**, **HK/uluslararası hisse + IPO**

### AI / Otomasyon
- **AI Agent** (hepsi): doğal dil → strateji → onay → sürekli izleme+yürütme
- Kategoriler: Trading / Cash / Risk / Fund management
- **Teknik indikatörler**: EMA, SMA, **RSI, MACD, Bollinger, ATR**, fiyat değişimi
- **Veri tetikleri**: canlı fiyat, **VIX**, Fear/Greed, earnings/financials (coming)
- **One-click AI Portfolio** (tema yaz → backtest'li sepet, $1) — RockFlow
- **Generated Assets** (Public): prompt → ajan sürüsü binlerce hisse tarar → **S&P'ye karşı backtest** → yatır; **Discovery Hub** marketplace
- **Auto-rebalancing**, **DeepSeek/derin analiz modu**
- **AI co-pilot** (Alpha/Bobby/Tori): SEC dosyaları, earnings call özeti (~2sa içinde), analist, sentiment
- **Persistent memory** (Tori) — oturumlar arası hafıza
- **Real-time X/sentiment** (Tori + Grok 4.2)
- **Agent Portfolios** (eToro): scoped API key'li ayrı sandbox portföy
- **eToro App Store + Builders Portal + MCP server + CLI** — geliştirici ekosistemi
- **Market Briefing / Key Moments / Earnings Hub** — AI günlük özet + fiyat hareketi açıklaması

### Sosyal / Copy
- **CopyTrader** (min $200, oransal), **Auto Copy** pozisyon-oran hizalama, intraday adjustment, spread protection
- **Copy Stop-Loss** (min %5)
- **Popular/Pro Investor Program** — 4 tier, AUC bazlı **gelir paylaşımı**
- **Strategy Square/Hub** — strateji keşfet/karşılaştır/yarış, **creator revenue-share**
- **Leaderboard + tam şeffaf track record** (copiers, AUC, holdings)
- **Sentiment**: Stocktwits entegrasyonu, TipRanks Smart Score, risk skoru 1-10
- **RockAlpha**: LLM'lerin $100k ile yarıştığı canlı AI trading arena
- **Referral komisyonu** (%25)
- Not: **Public sosyal feed'i kapattı** (AI'ya geçti)

### Research / Veri
- **Bond/Treasury screener**, **yield curve**, **Income Hub** (gelir takip+projeksiyon)
- **Morningstar** kurumsal araştırma, **TipRanks**, **BullAware** (korelasyon matrisi, treemap, seasonal, copier analytics, exportable)
- **TradingView ProCharts** — 9 grafik tipi, 100+ indikatör, kayıtlı layout
- AI earnings recap + KPI + ses özeti

### Portföy / Analytics
- Çok-varlık birleşik görünüm, **Smart Portfolios 65+** (thematic/top-trader/partner), risk skoru
- **Direct Indexing** (Public): özel vergi-optimize sepet, **otomatik tax-loss harvesting**, 100+ tema, %0.19
- Backtest (Generated Assets), risk-rate dashboard

### Banking / Cash
- **High-Yield Cash** (3.30% APY, $5M FDIC), idle-cash sweep
- **eToro Money + Visa debit (4% back in stocks)** + travel perks
- **Crypto staking** (~12% APY), **self-custody wallet** (Zengo)
- Treasury/Bond hesapları, **Jiko** T-bills

### Tax
- **Otomatik tax-loss harvesting** (Public Direct Indexing)
- Treasury faizi eyalet/yerel vergi muaf, tax-lot seçimi (coming)

### Eğitim
- Academy + difficulty/time etiketli kurslar, **Learn & Earn ödülleri**
- **Demo hesap $100k** (eToro), podcast (The Rundown), glossary

### Hesap Tipleri
- Standart, Margin, **Traditional/Roth/Crypto IRA**, Trust, Corporate, **1% IRA match**, **ACATS match**, CLEAR biyometrik onboarding

### UI/UX & Platform
- Hub'lar (Options/Income/Earnings/Discovery), Activity Feed audit trail
- Per-headline sentiment etiketi, watchlist alerts, treemap, correlation matrix
- **Gamification**: puan/Rock Energy, NFT ödül, fortune draw, deposit bonus, rank
- iOS + Android + web + **gerçek para/broker entegrasyonu**

---

## BÖLÜM 3 — GAP: Bizde EKSİK Olanlar (öncelikli)

### 🔴 KRİTİK (rakiplerin çekirdeği, bizde yok/sahte)
1. **Voice trading** — sesle al/sat/sorgu (RockFlow imzası). Mikrofon var ama dekoratif. ❌
2. **AI Agent kategorileri & gelişmiş tetikler** — MACD, Bollinger, ATR, VIX, Fear/Greed; OCO/trailing-stop. (Bizde sadece RSI/stop/buydip) 🟡
3. **One-click AI Portfolio / Generated Assets** — "tema yaz → backtest'li sepet üret → yatır". Bizde Smart Portfolios var ama **backtest yok, Invest butonu ölü**. ❌
4. **Gerçek backtest motoru** — Strategy Builder butonları ölü. ❌
5. **Options gerçek pozisyon** — zincir+payoff var ama Confirm pozisyon açmıyor. 🟡
6. **AI earnings/research derinliği** — SEC/earnings-call özeti, analist, sentiment skorları. Research kutusu ölü. ❌
7. **Sentiment katmanı** — sosyal/X sentiment, per-haber etiketi, hisse sentiment skoru. ❌

### 🟠 YÜKSEK (önemli farklılaştırıcılar)
8. **Copy Trading tam** — gerçek oransal mirror "her yeni trade", copy stop-loss uygulanması, creator gelir paylaşımı. 🟡
9. **Daha çok varlık** — gerçek crypto, bonds + screener, treasuries + ladder, fractional. ❌
10. **High-Yield Cash / Earn gerçek** — APY, faiz birikimi (şu an mock). 🔢
11. **Tax-loss harvesting / Direct Indexing.** ❌
12. **Gelişmiş emir tipleri** — trailing stop, take-profit, conditional/OCO, extended-hours. ❌
13. **TradingView kalitesinde grafik** — çoklu indikatör, çizim, layout. (Bizde tek area/candle) 🟡
14. **Persistent AI memory** — oturumlar arası kullanıcı hafızası (Tori). ❌
15. **Gerçek auth + DB + portföy kalıcılığı** (şu an localStorage demo). ❌

### 🟡 ORTA (derinlik & cila)
16. **Income Hub / portföy analytics** — korelasyon, treemap, gelir projeksiyon. ❌
17. **Leaderboard şeffaflığı** — track record, copiers, AUC. 🔢
18. **Gamification** — puan, rozet, deposit/learn ödülü. ❌
19. **Eğitim** — Learn & Earn, demo hesap, gerçek academy içeriği. ⬜
20. **Hesap tipleri** — IRA/retirement, match programları. ❌
21. **AI Agent marketplace / Discovery Hub** — paylaşılabilir strateji/sepet. ❌
22. **Banking** — kart, staking, cash sweep. ❌
23. **Pazarlama cila** — ölü linkler, blog yazıları, fiyat toggle, hot-stocks mount. ⬜

### 🟢 VELA'NIN ZATEN ÖNDE OLDUĞU YANLAR (koru & büyüt)
- **Claude opus tool-use ajanı** — RockFlow Bobby / Public Alpha / eToro Tori ile aynı lige oynuyor; 14 tool ile gerçekten **uyguluyor** (emir/alarm/otomasyon/rebalance).
- **Monokrom OLED tasarım** — rakiplerin çoğu kalabalık; bizim Linear/Vercel hissimiz premium.
- **Çalışan otomasyon motoru** (20sn poll, RSI/stop/dip yürütme) — çoğu rakipte "coming soon".

---

## Önerilen Ekleme Sırası (sonraki sprint'ler)
1. **AI'yı tam "sağ kol" yap**: voice trading + MACD/Bollinger/ATR/OCO/trailing + persistent memory
2. **Generated Assets / AI Portfolio + gerçek backtest motoru** (Invest butonunu canlandır)
3. **Options gerçek pozisyon + gelişmiş emir tipleri**
4. **Research/Earnings AI derinliği + sentiment katmanı**
5. **Copy trading tam mirror + leaderboard şeffaflık**
6. **Earn/Cash/Bonds/Tax gerçek** + varlık genişlemesi
7. **Gerçek auth + DB kalıcılık** (demo'dan ürüne)
8. **Cila**: gamification, eğitim, pazarlama ölü linkler
