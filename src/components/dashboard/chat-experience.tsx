"use client";

import { useRef, useState, useEffect, useCallback, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowUp,
  Mic,
  TrendingUp,
  Scale,
  Zap,
  CheckCircle2,
  Copy,
  RotateCw,
  SlidersHorizontal,
  Brain,
  ShieldCheck,
  MessageCircle,
  Power,
  ExternalLink,
  X,
  ChevronDown,
  Check,
  Paperclip,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useBrain, brainStore, checkBudget, AUTHORITY_LABELS, type Authority } from "@/lib/dashboard/use-brain";
import {
  useAiPrefs,
  aiPrefsStore,
  TIER_LABELS,
  TIER_DESC,
  TONE_LABELS,
  type ModelTier,
  type Tone,
} from "@/lib/dashboard/use-ai-prefs";
import { paperStore } from "@/lib/dashboard/paper-store";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { useWatchlist } from "@/lib/dashboard/use-watchlist";
import { useAutomations } from "@/lib/dashboard/use-automations";
import { useAlerts } from "@/lib/dashboard/use-alerts";
import { chatsStore } from "@/lib/dashboard/use-chats";
import { memoryStore } from "@/lib/dashboard/ai-memory";
import { goalStore } from "@/lib/dashboard/use-goals";
import { decisionStore } from "@/lib/dashboard/use-decisions";
import { toast } from "@/components/dashboard/toast";
import { securityStore } from "@/lib/dashboard/use-security";
import { fmtUsd } from "@/lib/dashboard/data";
import { Markdown } from "@/components/dashboard/markdown";
import { VelaAiMark, ThinkingShimmer } from "@/components/dashboard/vela-ai-mark";
import { TechnicalsCard, type TechnicalsData } from "@/components/dashboard/technicals-card";
import { ScoreCard, type VelaScoreData } from "@/components/dashboard/score-card";
import { WhatIfCard, type WhatIfData } from "@/components/dashboard/whatif-card";
import { SentimentCard, type SentimentData } from "@/components/dashboard/sentiment-card";
import { NewsCard, type NewsData } from "@/components/dashboard/news-card";
import { ProfileCard, type ProfileData } from "@/components/dashboard/profile-card";

type OrderProposal = {
  side: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
  stop?: number;
  rationale?: string;
};
type QuoteCard = { symbol: string; name: string; price: number; changePct: number };
type AutomationProposal = { rule: string; name?: string };
type RebalanceLeg = { side: "BUY" | "SELL"; symbol: string; shares: number; price: number };
type RebalanceProposal = { summary: string; orders: RebalanceLeg[] };

// Composer eki — base64 (yalın, data-URL prefiksi olmadan) + UI önizleme bilgisi.
// `previewUrl` yalnızca composer chip'i + gönderilen kullanıcı mesajı küçük
// resmi için tutulur (image'ler için data-URL, PDF için boş).
type Attachment = {
  id: string;
  kind: "image" | "pdf";
  mediaType: string;
  name: string;
  dataBase64: string; // yalın base64 (POST body'de kullanılır)
  previewUrl: string; // image: data-URL; pdf: ""
};

// Gönderilmiş kullanıcı mesajında gösterilecek küçük ek referansı.
// ÖNEMLİ: base64 BURADA tutulur ama SADECE in-memory (mevcut görünüm için).
// Kalıcı sohbet deposuna (localStorage) base64 YAZILMAZ — bloat olur. Bu yüzden
// persist/yükleme map'lerine attachments alanı eklenmez; sohbet yeniden açılınca
// küçük resimler görünmez (kabul edilen ödünleşim — chat geçmişini şişirmemek için).
type MsgAttachment = {
  kind: "image" | "pdf";
  name: string;
  previewUrl: string; // image data-URL veya "" (pdf)
};

type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  order?: OrderProposal;
  quotes?: QuoteCard[];
  automation?: AutomationProposal;
  rebalance?: RebalanceProposal;
  technicals?: TechnicalsData;
  velaScore?: VelaScoreData;
  whatif?: WhatIfData;
  sentiment?: SentimentData;
  news?: NewsData;
  profile?: ProfileData;
  tool?: string | null;
  streaming?: boolean;
  writing?: boolean; // ilk harf geldi mi (logo durumu için; metni state'e koymadan)
  attachments?: MsgAttachment[]; // in-memory ek küçük resimleri (persist edilmez)
  usedTools?: string[]; // Glass-Box: bu yanıtta kullanılan araçların izi (şeffaflık)
};

const SUGGESTIONS = [
  { icon: TrendingUp, label: "Portföyüm nasıl gidiyor? En büyük risklerim neler?" },
  { icon: Zap, label: "Nvidia'dan 500 dolarlık al ve stop koy" },
  { icon: Scale, label: "Kriptodaki riskim fazla mı?" },
  { icon: Sparkles, label: "NVDA, AMD ve AVGO'yu karşılaştır" },
];

const TOOL_LABELS: Record<string, string> = {
  get_quote: "Canlı fiyat çekiliyor",
  get_company_profile: "Şirket profili alınıyor",
  get_news: "Haberler taranıyor",
  search_symbols: "Piyasa aranıyor",
  propose_order: "Emir hazırlanıyor",
  rebalance_portfolio: "Dengeleme planı hazırlanıyor",
  start_copy: "Kopyalama açılıyor",
  deploy_strategy: "Strateji hazırlanıyor",
  create_alert: "Alarm kuruluyor",
  add_to_watchlist: "İzleme listesine ekleniyor",
  remove_from_watchlist: "İzleme listesinden çıkarılıyor",
  create_automation: "Otomasyon kuruluyor",
  get_sentiment: "Piyasa duyarlılığı analiz ediliyor",
  get_technicals: "Teknik göstergeler hesaplanıyor",
  get_vela_score: "Finovela Skoru hesaplanıyor",
  whatif_simulation: "Senaryo simüle ediliyor",
  remember_fact: "Hafızaya kaydediliyor",
  navigate: "Sayfaya gidiliyor",
  web_search: "Web'de aranıyor",
};

// ---- Ek (attachment) limitleri — backend ATTACH_CAPS ile uyumlu ----
const ATTACH_MAX_COUNT = 4;
const ATTACH_MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ATTACH_MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB
const ATTACH_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ATTACH_PDF_TYPE = "application/pdf";
const ATTACH_ACCEPT = [...ATTACH_IMAGE_TYPES, ATTACH_PDF_TYPE].join(",");

/** Dosyayı yalın base64'e (data-URL prefiksi olmadan) + data-URL önizlemeye çevirir. */
function readFileAsBase64(file: File): Promise<{ dataBase64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const dataBase64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : "";
      resolve({ dataBase64, dataUrl });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function detectLocale(text: string): string {
  // basit TR tespiti
  return /[şğıçöü]|nasıl|portföy|hisse|al(ı|)m|riski|öner/i.test(text) ? "Turkish" : "English";
}

export function ChatExperience({ chatId }: { chatId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // send() ek listesini dep'e eklemeden (regenerate'i kırmadan) okuyabilsin diye ref.
  const attachmentsRef = useRef<Attachment[]>([]);
  attachmentsRef.current = attachments;
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const router = useRouter();
  const convoId = useRef<string>(chatId ?? `c${Date.now()}`);

  // mevcut sohbeti yükle (id verildiyse)
  useEffect(() => {
    if (!chatId) {
      convoId.current = `c${Date.now()}`;
      setMessages([]);
      return;
    }
    const existing = chatsStore.get().find((c) => c.id === chatId);
    if (existing) {
      convoId.current = chatId;
      idRef.current = existing.messages.reduce((mx, m) => Math.max(mx, m.id), 0);
      // Depolanan kart yüklerini (order/quotes/automation/rebalance) in-memory Msg
      // şekline geri yorumla. Akış alanları (streaming/writing/tool) yüklenmez —
      // yüklenen mesaj her zaman tamamlanmış (statik) durumdadır.
      setMessages(
        existing.messages.map((m) => {
          // Depo katmanı (ChatMsg) yalnızca order/quotes/automation/rebalance'ı tip
          // olarak tanır; yeni kart alanları aynı kalıpla saklanır ama tipte yok —
          // bu yüzden gevşek bir record üzerinden okunur (depo dosyası değişmez).
          const rec = m as Record<string, unknown>;
          return {
            id: m.id,
            role: m.role,
            text: m.text,
            ...(m.order ? { order: m.order as Msg["order"] } : {}),
            ...(m.quotes ? { quotes: m.quotes as Msg["quotes"] } : {}),
            ...(m.automation ? { automation: m.automation as Msg["automation"] } : {}),
            ...(m.rebalance ? { rebalance: m.rebalance as Msg["rebalance"] } : {}),
            ...(rec.usedTools ? { usedTools: rec.usedTools as string[] } : {}),
            ...(rec.technicals ? { technicals: rec.technicals as Msg["technicals"] } : {}),
            ...(rec.velaScore ? { velaScore: rec.velaScore as Msg["velaScore"] } : {}),
            ...(rec.whatif ? { whatif: rec.whatif as Msg["whatif"] } : {}),
            ...(rec.sentiment ? { sentiment: rec.sentiment as Msg["sentiment"] } : {}),
            ...(rec.news ? { news: rec.news as Msg["news"] } : {}),
            ...(rec.profile ? { profile: rec.profile as Msg["profile"] } : {}),
          };
        }),
      );
    }
  }, [chatId]);

  const titleRef = useRef<string | null>(null);

  // her değişimde kalıcı kaydet (akış bitince)
  useEffect(() => {
    if (messages.length === 0 || busy) return;
    const firstUser = messages.find((m) => m.role === "user");
    const firstAi = messages.find((m) => m.role === "assistant" && m.text);

    const persist = (title: string) =>
      chatsStore.upsert({
        id: convoId.current,
        title,
        ts: Date.now(),
        // Araç-sonucu kartlarını (order/quotes/automation/rebalance) da sakla ki
        // sohbet yeniden açıldığında zengin kartlar geri gelsin. Akış-içi alanlar
        // (streaming/writing/tool) kalıcılaştırılmaz — onlar geçici UI durumudur.
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          ...(m.order ? { order: m.order } : {}),
          ...(m.quotes ? { quotes: m.quotes } : {}),
          ...(m.automation ? { automation: m.automation } : {}),
          ...(m.rebalance ? { rebalance: m.rebalance } : {}),
          ...(m.usedTools ? { usedTools: m.usedTools } : {}),
          ...(m.technicals ? { technicals: m.technicals } : {}),
          ...(m.velaScore ? { velaScore: m.velaScore } : {}),
          ...(m.whatif ? { whatif: m.whatif } : {}),
          ...(m.sentiment ? { sentiment: m.sentiment } : {}),
          ...(m.news ? { news: m.news } : {}),
          ...(m.profile ? { profile: m.profile } : {}),
        })),
      });

    // başlık yoksa AI'a bir kez özetlet (ilk değişimden sonra)
    if (!titleRef.current && firstUser && firstAi) {
      titleRef.current = chatsStore.titleFrom(firstUser.text); // geçici
      persist(titleRef.current);
      fetch("/api/chat-title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user: firstUser.text, assistant: firstAi.text }),
      })
        .then((r) => r.json())
        .then((d: { title?: string }) => {
          if (d.title) {
            titleRef.current = d.title;
            persist(d.title);
          }
        })
        .catch(() => {});
    } else {
      persist(titleRef.current ?? chatsStore.titleFrom(firstUser?.text ?? "New chat"));
    }
  }, [messages, busy]);

  const { positions, summary, risk } = useLivePortfolio();
  const { toggle: toggleWatch, has: hasWatch } = useWatchlist();
  const { create: createAutomationRaw } = useAutomations();
  const { create: createAlert } = useAlerts();

  // Stabil ref'li otomasyon callback'i — memo'lu MessageRow'un her drip frame'inde
  // yeniden render olmasını önler (yazma kasmasını engeller).
  const createAutomationRef = useRef(createAutomationRaw);
  createAutomationRef.current = createAutomationRaw;
  const createAutomation = useCallback(
    (rule: string, name?: string) => createAutomationRef.current(rule, name),
    [],
  );

  // Mesaj sayısı DEĞİŞİNCE (yeni mesaj eklenince) en alta in — ama SADECE kullanıcı
  // zaten en alttaysa. Yukarı kaydırıp okuyorsa onu aşağı fırlatma. Akış sırasında
  // gelen token'lar messages.length'i değiştirmez (tek mesaj patch'lenir), bu yüzden
  // bu effect her token'da değil yalnızca yeni mesaj geldiğinde çalışır.
  const msgCount = messages.length;
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const atBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 160;
    if (atBottom) sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
  }, [msgCount]);

  // canlı portföyü AI için metne çevir
  const portfolioSnapshot = useCallback(() => {
    const lines = positions
      .map(
        (p) =>
          `${p.symbol} (${p.name}): ${p.shares} shares, avg $${p.avgCost}, now $${p.price} (${p.changePct >= 0 ? "+" : ""}${p.changePct}% today), value $${p.value.toFixed(0)}, P/L ${p.pl >= 0 ? "+" : ""}$${p.pl.toFixed(0)} (${p.plPct}%), sector ${p.sector}`,
      )
      .join("\n");
    return `Total value: $${summary.total.toFixed(0)} | Invested: $${summary.invested.toFixed(0)} | Cash: $${summary.cash.toFixed(0)} | Total return: ${summary.totalPl >= 0 ? "+" : ""}$${summary.totalPl.toFixed(0)} (${summary.totalPlPct}%) | Risk score: ${risk.score}/10 (${risk.label}), largest position ${risk.topWeight}%, crypto ${risk.cryptoWeight}%\nHoldings:\n${lines}`;
  }, [positions, summary, risk]);

  // Hedefler bağlamı — AI'nın pusulası (ana hedef + yan hedefler).
  const goalsSnapshot = useCallback(() => {
    const gs = goalStore.get();
    if (!gs.length) return "";
    const fmt = (g: (typeof gs)[number]) => {
      const tgt = g.targetValue
        ? ` — hedef ${g.currency === "TRY" ? "₺" : "$"}${g.targetValue.toLocaleString("en-US")}`
        : "";
      const dl = g.deadline ? `, son tarih ${new Date(g.deadline).toLocaleDateString("tr-TR")}` : "";
      return `• [${g.kind === "main" ? "ANA HEDEF" : "yan hedef"}] ${g.title}${tgt}${dl} (risk: ${g.riskTolerance}, ilerleme %${g.progress})${g.detail ? ` — ${g.detail}` : ""}`;
    };
    const main = gs.find((g) => g.kind === "main");
    const sides = gs.filter((g) => g.kind === "side" && g.status === "active");
    return [main ? fmt(main) : "", ...sides.map(fmt)].filter(Boolean).join("\n");
  }, []);

  // Brain bağlamı — yetki seviyesi + güven bütçesi.
  const brainSnapshot = useCallback(() => {
    const b = brainStore.get();
    const lbl = AUTHORITY_LABELS[b.authority].title;
    if (b.killSwitch) return `Yetki: ${lbl}. ACİL DURDURMA AKTİF — hiçbir otonom işlem yapma, sadece danış.`;
    return `Yetki: ${lbl} (${b.authority}). Güven bütçesi → tek işlem max %${b.maxTradePct} portföy, günlük max ${b.maxDailyTrades} işlem, tek varlık max %${b.maxPositionPct}, ${b.requirePinOver ? `${b.requirePinOver}$ üstü işlemde PIN gerekir` : "PIN yok"}.`;
  }, []);

  const runAction = useCallback(
    (data: { action: string; symbols?: string[]; page?: string; symbol?: string; condition?: "above" | "below"; price?: number; fact?: string }) => {
      if (data.action === "watchlist_add" && data.symbols) {
        data.symbols.forEach((s) => { if (!hasWatch(s)) toggleWatch(s); });
      } else if (data.action === "watchlist_remove" && data.symbols) {
        data.symbols.forEach((s) => { if (hasWatch(s)) toggleWatch(s); });
      } else if (data.action === "create_alert" && data.symbol && data.condition && data.price != null) {
        createAlert(data.symbol, data.condition, data.price);
      } else if (data.action === "remember" && data.fact) {
        memoryStore.remember(data.fact);
      } else if (data.action === "navigate" && data.page) {
        const p = data.page;
        const url = p.startsWith("stock:")
          ? `/dashboard/stock/${p.slice(6).toUpperCase()}`
          : p === "overview"
            ? "/dashboard"
            : `/dashboard/${p}`;
        setTimeout(() => router.push(url), 600);
      }
    },
    [hasWatch, toggleWatch, createAlert, router],
  );

  const send = useCallback(
    async (text: string, replaceFrom?: number) => {
      // Boş metin + ek yoksa gönderme. Yalnızca ek varken de göndermeye izin ver
      // (kullanıcı bir görsel/PDF atıp "bunu incele" demeden de soru sorabilir).
      const hasAttach = replaceFrom == null && attachmentsRef.current.length > 0;
      if ((!text.trim() && !hasAttach) || busy) return;

      // Ekler YALNIZCA taze gönderimde kullanılır; regenerate (replaceFrom) eski bir
      // metin turunu tekrarlar — ek taşımaz (base64 zaten persist edilmez).
      const sendAttachments = hasAttach ? attachmentsRef.current : [];
      const base = replaceFrom != null ? messages.slice(0, replaceFrom) : messages;
      const history = base.map((m) => ({ role: m.role, content: m.text }));
      const userId = ++idRef.current;
      const aiId = ++idRef.current;
      setMessages([
        ...base,
        ...(replaceFrom != null
          ? []
          : [
              {
                id: userId,
                role: "user" as const,
                text,
                // in-memory küçük resim referansları (persist edilmez)
                ...(sendAttachments.length
                  ? {
                      attachments: sendAttachments.map((a) => ({
                        kind: a.kind,
                        name: a.name,
                        previewUrl: a.previewUrl,
                      })),
                    }
                  : {}),
              },
            ]),
        { id: aiId, role: "assistant" as const, text: "", streaming: true, tool: null },
      ]);
      setInput("");
      setAttachments([]); // ek durumunu gönderimden sonra temizle
      setBusy(true);

      const patch = (fn: (m: Msg) => Msg) =>
        setMessages((arr) => arr.map((m) => (m.id === aiId ? fn(m) : m)));

      // AKIŞ — Claude.ai mimarisi: React/Markdown'a sokmadan doğrudan DOM
      // text-node'una yaz; frame başına TEK kez (rAF coalescer). Markdown sadece
      // bitince uygulanır.
      //
      // SMOOTHING: Anthropic SDK + ağ paket birleşmesi metni 5-10 kelimelik
      // "burst"ler halinde teslim eder. Çareyi YUKARIDA çözemeyiz (birlikte gelen
      // veriyi ayıramayız), bu yüzden gelen metni `full` tamponunda biriktirip
      // her frame'de DOM'a SADECE birkaç karakter daha sızdırırız (daktilo). Bu
      // ASLA gelenin ötesine gecikme eklemez: yalnızca zaten ELDE olan metni
      // pürüzsüzleştirir ve tampon büyüdükçe hızlanır (geride kalmaz). Akış
      // bitince kalan her şey anında yazılır.
      let full = "";          // sunucudan gelen TÜM metin (gerçek durum)
      let drawn = 0;          // DOM'a şimdiye dek sızdırılan karakter sayısı
      let raf = 0;
      let streamDone = false; // akış bitti → kalanı anında boşalt
      let markedWriting = false;
      const streamEl = () =>
        scrollRef.current?.querySelector<HTMLElement>(`[data-stream="${aiId}"]`) ?? null;

      // Takip kilidi: akış başında en alttayız → takip et. Kullanıcı akış sırasında
      // yukarı kaydırırsa takibi bırak (aşağı fırlatma); tekrar en alta gelirse
      // takibe devam. nearBottom'u her frame değil, scroll olayında değerlendiririz.
      let follow = true;
      const onUserScroll = () => {
        const sc = scrollRef.current;
        if (!sc) return;
        follow = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 160;
      };
      scrollRef.current?.addEventListener("scroll", onUserScroll, { passive: true });

      const writeDom = (upto: number) => {
        const el = streamEl();
        if (!el) return;
        el.textContent = full.slice(0, upto);
        if (follow && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };

      const flush = () => {
        raf = 0;
        const remaining = full.length - drawn;
        if (remaining <= 0) return;

        // Akış bittiyse kalan her şeyi tek seferde yaz — gizli gecikme yok.
        if (streamDone) {
          drawn = full.length;
          writeDom(drawn);
          return;
        }

        // Yumuşak daktilo: her frame küçük-orta bir adım. Tampon çok büyürse (büyük
        // burst) makul hızlan ama görünür "sıçrama" yapacak kadar değil. Üst sınır
        // 24 char/frame (~1400 cps) — burst sonrası ~1 saniyede yetişir, akıcı kalır.
        const step = Math.min(24, Math.max(4, Math.ceil(remaining / 10)));
        drawn = Math.min(full.length, drawn + step);
        writeDom(drawn);

        // Hâlâ gösterilecek metin varsa bir sonraki frame'i planla.
        if (drawn < full.length) raf = requestAnimationFrame(flush);
      };
      const queueText = (delta: string) => {
        full += delta;
        if (!markedWriting) {
          markedWriting = true;
          patch((m) => ({ ...m, writing: true })); // logo "yazıyor" + shimmer kapanır
        }
        if (!raf) raf = requestAnimationFrame(flush);
      };

      try {
        const prefs = aiPrefsStore.get();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: text }],
            portfolio: portfolioSnapshot(),
            memory: memoryStore.asContext(),
            goals: goalsSnapshot(),
            brain: brainSnapshot(),
            locale: detectLocale(text),
            model: prefs.tier,
            tone: prefs.tone,
            // Ekler yalnızca taze gönderimde gider (en son kullanıcı mesajına
            // backend tarafından vision/document bloğu olarak iliştirilir).
            ...(sendAttachments.length
              ? {
                  attachments: sendAttachments.map((a) => ({
                    type: a.kind,
                    mediaType: a.mediaType,
                    dataBase64: a.dataBase64,
                  })),
                }
              : {}),
          }),
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          // 402 = günlük kredi bitti → kullanım sayacını tazele + yükseltme modalını aç.
          if (res.status === 402 || err?.code === "usage_limit") {
            window.dispatchEvent(new Event("vela:usage-changed"));
            window.dispatchEvent(
              new CustomEvent("vela:open-plan-picker", { detail: { reason: "limit" } }),
            );
            patch((m) => ({
              ...m,
              streaming: false,
              tool: null,
              text:
                "Bugünkü ücretsiz yapay zeka hakkın doldu. Sınırsız sohbet için Pro'ya yükseltebilirsin.",
            }));
            setBusy(false);
            return;
          }
          patch((m) => ({
            ...m,
            streaming: false,
            tool: null,
            text:
              err?.error === "ANTHROPIC_API_KEY missing"
                ? "AI yapılandırılmamış — ANTHROPIC_API_KEY ekleyince sohbet açılır."
                : "Finovela'ya ulaşırken bir sorun oldu. Tekrar dener misin?",
          }));
          setBusy(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const chunks = buf.split("\n\n");
          buf = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const ev = chunk.match(/^event: (.+)$/m)?.[1];
            const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "))?.slice(6);
            if (!ev || !dataLine) continue;
            const data = JSON.parse(dataLine);
            if (ev === "text") {
              queueText(data.delta);
            } else if (ev === "tool") {
              // Glass-Box: araç adını anlık göster + kalıcı ize ekle (tekrarsız).
              patch((m) => ({
                ...m,
                tool: data.name,
                usedTools: m.usedTools?.includes(data.name)
                  ? m.usedTools
                  : [...(m.usedTools ?? []), data.name],
              }));
            } else if (ev === "tool_result") {
              patch((m) => ({ ...m, tool: null }));
              const d = data.data;
              if (d?.type === "order") patch((m) => ({ ...m, order: d.order }));
              else if (d?.type === "quotes") patch((m) => ({ ...m, quotes: (d.quotes as QuoteCard[]).slice(0, 4) }));
              else if (d?.type === "automation") patch((m) => ({ ...m, automation: { rule: d.rule, name: d.name } }));
              else if (d?.type === "rebalance") patch((m) => ({ ...m, rebalance: { summary: d.summary, orders: d.orders } }));
              else if (d?.type === "technicals") patch((m) => ({ ...m, technicals: d as TechnicalsData }));
              else if (d?.type === "vela_score") patch((m) => ({ ...m, velaScore: d as VelaScoreData }));
              else if (d?.type === "whatif") patch((m) => ({ ...m, whatif: d as WhatIfData }));
              else if (d?.type === "sentiment") patch((m) => ({ ...m, sentiment: d as SentimentData }));
              else if (d?.type === "news") patch((m) => ({ ...m, news: d as NewsData }));
              else if (d?.type === "profile") patch((m) => ({ ...m, profile: d as ProfileData }));
              else if (d?.type === "action") runAction(d);
            } else if (ev === "error") {
              if (raf) cancelAnimationFrame(raf);
              patch((m) => ({ ...m, streaming: false, tool: null, text: m.text || "Hata: " + data.message }));
            }
          }
        }
        // Akış bitti — kalan tampon varsa anında boşalt, sonra TEK commit
        // (Markdown bir kez render). streamDone → flush gizli gecikme bırakmaz.
        streamDone = true;
        if (raf) cancelAnimationFrame(raf);
        flush();
        patch((m) => ({ ...m, streaming: false, tool: null, text: full }));
        // Sohbet tüketildi — kredi halkasını tazele.
        window.dispatchEvent(new Event("vela:usage-changed"));
      } catch {
        if (raf) cancelAnimationFrame(raf);
        patch((m) => ({ ...m, streaming: false, tool: null, text: "Bağlantı koptu. Tekrar dener misin?" }));
      } finally {
        scrollRef.current?.removeEventListener("scroll", onUserScroll);
        setBusy(false);
      }
    },
    [busy, messages, portfolioSnapshot, runAction],
  );

  const regenerate = useCallback(
    (aiIndex: number) => {
      // bu AI mesajından önceki son kullanıcı mesajını bul
      let userIdx = aiIndex - 1;
      while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx--;
      if (userIdx < 0) return;
      send(messages[userIdx].text, aiIndex);
    },
    [messages, send],
  );

  // ---- SESLE TRADING (Web Speech API) — "Tesla'mın yarısını sat" gibi komutlar ----
  // Web Speech API yalnızca Chrome ve masaüstü Safari'de güvenilir çalışır.
  // Desteklenmiyorsa düğme devre dışı + ipucu ile gösterilir (sessizce gizlenmez).
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const inputBoxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    setVoiceSupported(true);
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    // Uygulama Türkçe öncelikli — yanlış transkripsiyonu önlemek için açıkça tr-TR.
    r.lang = "tr-TR";
    r.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      // Metni kutuya yaz; otomatik GÖNDERME yok — kullanıcı gözden geçirip düzenler.
      setInput(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        // Konuşma bitti: kutuya odaklan ki kullanıcı düzenleyip Enter'a bassın.
        const el = inputBoxRef.current;
        if (el) {
          el.focus();
          const len = el.value.length;
          try { el.setSelectionRange(len, len); } catch { /* yok say */ }
        }
      }
    };
    r.onend = () => setListening(false);
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      setListening(false);
      switch (e.error) {
        case "not-allowed":
        case "service-not-allowed":
          toast.error("Mikrofon izni gerekli.", "Tarayıcı ayarlarından mikrofona izin ver.");
          break;
        case "no-speech":
          toast.info("Ses algılanmadı.", "Mikrofona daha yakın konuşmayı dene.");
          break;
        case "audio-capture":
          toast.error("Mikrofon bulunamadı.", "Bir mikrofon bağlı mı kontrol et.");
          break;
        case "network":
          toast.error("Ağ hatası.", "Sesli giriş için internet bağlantısı gerekiyor.");
          break;
        case "aborted":
          // Kullanıcı durdurdu — bildirim gösterme.
          break;
        default:
          toast.error("Sesli giriş başarısız.", "Lütfen tekrar dene.");
      }
    };
    recogRef.current = r;
    return () => {
      try { r.abort(); } catch { /* yok say */ }
      recogRef.current = null;
    };
  }, []);

  const toggleVoice = useCallback(() => {
    const r = recogRef.current;
    if (!r) {
      toast.info("Sesli giriş kullanılamıyor.", "Tarayıcın sesli girişi desteklemiyor.");
      return;
    }
    if (listening) {
      // Tekrar dokunma: dinlemeyi temiz biçimde durdur.
      try { r.stop(); } catch { /* yok say */ }
      setListening(false);
    } else {
      r.lang = "tr-TR";
      setInput("");
      try {
        r.start();
        setListening(true);
      } catch {
        // Bazı tarayıcılar art arda start çağrısında hata atar — durumu sıfırla.
        setListening(false);
      }
    }
  }, [listening]);

  // ---- EK (attachment) yönetimi ----
  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      const next: Attachment[] = [];
      let rejected = false;
      // Mevcut + yeni eklerin toplam sayısı ATTACH_MAX_COUNT'u aşamaz.
      let slots = ATTACH_MAX_COUNT - attachments.length;

      for (const file of list) {
        if (slots <= 0) {
          toast.error("Çok fazla dosya", `En fazla ${ATTACH_MAX_COUNT} dosya ekleyebilirsin.`);
          break;
        }
        const isImage = ATTACH_IMAGE_TYPES.includes(file.type);
        const isPdf = file.type === ATTACH_PDF_TYPE;
        if (!isImage && !isPdf) {
          rejected = true;
          continue;
        }
        const cap = isImage ? ATTACH_MAX_IMAGE_BYTES : ATTACH_MAX_PDF_BYTES;
        if (file.size > cap) {
          toast.error(
            "Dosya çok büyük",
            `${file.name} — sınır ${isImage ? "5MB (görsel)" : "10MB (PDF)"}.`,
          );
          continue;
        }
        try {
          const { dataBase64, dataUrl } = await readFileAsBase64(file);
          if (!dataBase64) {
            rejected = true;
            continue;
          }
          next.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            kind: isImage ? "image" : "pdf",
            mediaType: file.type,
            name: file.name,
            dataBase64,
            previewUrl: isImage ? dataUrl : "",
          });
          slots--;
        } catch {
          rejected = true;
        }
      }

      if (rejected) {
        toast.error("Desteklenmeyen dosya", "Yalnızca PNG, JPEG, WebP, GIF ve PDF eklenebilir.");
      }
      if (next.length > 0) setAttachments((prev) => [...prev, ...next].slice(0, ATTACH_MAX_COUNT));
    },
    [attachments.length],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const onFilePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) void addFiles(e.target.files);
      e.target.value = ""; // aynı dosyayı tekrar seçebilmek için sıfırla
    },
    [addFiles],
  );

  // Yapıştırılan görselleri (clipboard) yakala — düşük riskli ekstra.
  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const imgs = Array.from(e.clipboardData.items)
        .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter((f): f is File => f != null);
      if (imgs.length > 0) {
        e.preventDefault();
        void addFiles(imgs);
      }
    },
    [addFiles],
  );

  // Composer'a sürükle-bırak — düşük riskli ekstra.
  const [dragOver, setDragOver] = useState(false);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const empty = messages.length === 0;

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-col bg-[var(--ais-bg)]">
      {/* sohbet başlığı — Vela Brain ayar düğmesi */}
      <div
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ borderColor: "var(--ais-line)" }}
      >
        <div className="flex items-center gap-2">
          <Image src="/vela-mark.png" alt="" width={22} height={22} className="shrink-0" />
          <span className="text-sm font-semibold text-[var(--ais-fg)]">Finovela Sohbet</span>
        </div>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          title="Finovela Brain ayarları"
          className={
            settingsOpen
              ? "flex items-center gap-1.5 rounded-full bg-[var(--ais-accent-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ais-accent)]"
              : "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
          }
          style={settingsOpen ? undefined : { borderColor: "var(--ais-line-strong)" }}
        >
          <SlidersHorizontal size={14} />
          Ayarlar
        </button>
      </div>

      {settingsOpen && <BrainQuickSettings onClose={() => setSettingsOpen(false)} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl">
          {empty ? (
            <div className="flex flex-col items-center pt-16 text-center">
              {/* Açık zeminde 'screen' blend video kaybolur → statik PNG marka kullan. */}
              <VelaAiMark size={84} state="idle" />
              <h2 className="font-display mt-6 text-[28px] font-bold tracking-tight text-[var(--ais-fg)]">
                Sana nasıl yardımcı olabilirim?
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--ais-fg-muted)]">
                Portföyünü analiz et, hisse araştır, işlem yap, otomasyon kur — düz
                konuşma diliyle. Senin sağ kolun.
              </p>
              <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => send(s.label)}
                    className="flex items-center gap-3 rounded-2xl border bg-[var(--ais-surface)] px-4 py-3.5 text-left text-sm text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                    style={{ borderColor: "var(--ais-line)" }}
                  >
                    <s.icon size={18} className="shrink-0 text-[var(--ais-accent)]" />
                    <span className="leading-snug">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, idx) => (
                <MessageRow
                  key={m.id}
                  m={m}
                  onRegenerate={m.role === "assistant" && !m.streaming ? () => regenerate(idx) : undefined}
                  onAutomation={createAutomation}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="border-t bg-[var(--ais-bg)] px-6 py-4"
        style={{ borderColor: "var(--ais-line)" }}
      >
        <div className="mx-auto max-w-3xl">
          {/* gizli dosya seçici — paperclip ile tetiklenir */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ATTACH_ACCEPT}
            multiple
            onChange={onFilePick}
            className="hidden"
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className="rounded-3xl border bg-[var(--ais-surface)] p-2 pl-5 shadow-sm transition focus-within:border-[var(--ais-accent)]"
            style={{ borderColor: dragOver ? "var(--ais-accent)" : "var(--ais-line-strong)" }}
          >
            {/* ek küçük resim chip'leri — textarea'nın üstünde */}
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 pt-1">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="group/att relative flex items-center gap-2 rounded-xl border bg-[var(--ais-surface-2)] py-1.5 pl-1.5 pr-2"
                    style={{ borderColor: "var(--ais-line)" }}
                  >
                    {a.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.previewUrl}
                        alt={a.name}
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ais-accent-bg)] text-[var(--ais-accent)]">
                        <FileText size={18} />
                      </span>
                    )}
                    <span className="max-w-[120px] truncate text-xs text-[var(--ais-fg-muted)]">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      aria-label={`${a.name} ekini kaldır`}
                      className="grid h-5 w-5 place-items-center rounded-full bg-[var(--ais-overlay-strong)] text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputBoxRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={onPaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Finovela'ya yaz…"
              className="max-h-32 flex-1 resize-none bg-transparent py-2.5 text-[15px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
            />
            <ModelPicker />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= ATTACH_MAX_COUNT}
              aria-label="Dosya veya görsel ekle"
              title={
                attachments.length >= ATTACH_MAX_COUNT
                  ? `En fazla ${ATTACH_MAX_COUNT} dosya`
                  : "Dosya veya görsel ekle (resim, PDF)"
              }
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Paperclip size={19} />
            </button>
            <button
              type="button"
              onClick={toggleVoice}
              disabled={!voiceSupported}
              aria-pressed={listening}
              aria-label={
                !voiceSupported
                  ? "Tarayıcın sesli girişi desteklemiyor."
                  : listening
                    ? "Dinleniyor — durdurmak için dokun"
                    : "Sesli komut"
              }
              title={
                !voiceSupported
                  ? "Tarayıcın sesli girişi desteklemiyor."
                  : listening
                    ? "Dinleniyor… durdurmak için dokun"
                    : "Sesli komut — örn. 'Tesla'mın yarısını sat'"
              }
              className={
                !voiceSupported
                  ? "grid h-10 w-10 shrink-0 cursor-not-allowed place-items-center rounded-full text-[var(--ais-fg-faint)] opacity-40"
                  : listening
                    ? "grid h-10 w-10 shrink-0 animate-pulse place-items-center rounded-full bg-[#d93025]/12 text-[#d93025] ring-2 ring-[#d93025]/30 transition"
                    : "grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
              }
            >
              <Mic size={19} fill={listening ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => send(input)}
              disabled={(!input.trim() && attachments.length === 0) || busy}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ais-accent)] text-white transition hover:opacity-90 disabled:opacity-30"
            >
              <ArrowUp size={20} strokeWidth={2.5} />
            </button>
          </div>
          </div>
          <p className="mt-2 text-center text-xs text-[var(--ais-fg-faint)]">
            Finovela canlı veri kullanır ve hata yapabilir. Paper-trading demo — yatırım tavsiyesi değildir.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Composer içi model seçici — "Vela 1.2 ▾" tarzı kompakt dropdown. */
function ModelPicker() {
  const { prefs } = useAiPrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0 self-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Finovela modelini seç"
        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
      >
        {TIER_LABELS[prefs.tier]}
        <ChevronDown size={12} strokeWidth={2.5} className={open ? "rotate-180 transition" : "transition"} />
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 w-52 overflow-hidden rounded-2xl border bg-[var(--ais-surface)] p-1 shadow-xl shadow-black/10"
          style={{ borderColor: "var(--ais-line)" }}
        >
          {(["vela-1.2", "vela-1.1", "vela-1"] as ModelTier[]).map((t) => {
            const on = prefs.tier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  aiPrefsStore.setTier(t);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
                  on ? "bg-[var(--ais-surface-2)]" : "hover:bg-[var(--ais-surface-2)]"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-[var(--ais-fg)]">{TIER_LABELS[t]}</span>
                  <span className="block text-[11px] text-[var(--ais-fg-faint)]">{TIER_DESC[t]}</span>
                </span>
                {on && <Check size={14} strokeWidth={2.5} style={{ color: "var(--ais-accent)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const QS_META: Record<Authority, { icon: typeof Zap; color: string }> = {
  full: { icon: Zap, color: "var(--ais-green)" },
  semi: { icon: ShieldCheck, color: "var(--ais-accent)" },
  advisory: { icon: MessageCircle, color: "var(--ais-fg-faint)" },
};

/** Sohbet içi hızlı Vela Brain ayarları — yetki seviyesi + kill switch. */
function BrainQuickSettings({ onClose }: { onClose: () => void }) {
  const { settings, setAuthority, toggleKillSwitch } = useBrain();
  const { prefs, setTone } = useAiPrefs();
  return (
    <div
      className="border-b bg-[var(--ais-surface)] px-6 py-4"
      style={{ borderColor: "var(--ais-line)" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={16} style={{ color: "var(--ais-accent)" }} />
            <span className="text-sm font-semibold text-[var(--ais-fg)]">Finovela Brain — yetki</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/brain"
              className="flex items-center gap-1 text-xs font-medium text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
            >
              Tüm ayarlar <ExternalLink size={12} />
            </Link>
            <button onClick={onClose} className="text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {(["full", "semi", "advisory"] as const).map((a) => {
            const meta = QS_META[a];
            const Icon = meta.icon;
            const on = settings.authority === a && !settings.killSwitch;
            return (
              <button
                key={a}
                onClick={() => setAuthority(a)}
                disabled={settings.killSwitch}
                className="rounded-xl border p-3 text-left transition disabled:opacity-40"
                style={{
                  borderColor: on ? "var(--ais-accent)" : "var(--ais-line)",
                  background: on ? "var(--ais-accent-bg)" : "var(--ais-surface)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={15} style={{ color: meta.color }} />
                  <span className="text-sm font-semibold text-[var(--ais-fg)]">{AUTHORITY_LABELS[a].title}</span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={toggleKillSwitch}
          className={
            settings.killSwitch
              ? "mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ais-accent)] py-2 text-sm font-semibold text-white transition hover:opacity-90"
              : "mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d93025]/30 bg-[#d93025]/10 py-2 text-sm font-semibold text-[#d93025] transition hover:bg-[#d93025]/15"
          }
        >
          <Power size={15} />
          {settings.killSwitch ? "Otonomu tekrar başlat" : "Acil durdurma (tüm otonomu durdur)"}
        </button>

        {/* Yanıt tonu — sohbetin üslubu */}
        <div className="mt-4 flex items-center gap-2">
          <MessageCircle size={15} style={{ color: "var(--ais-accent)" }} />
          <span className="text-sm font-semibold text-[var(--ais-fg)]">Yanıt tonu</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["balanced", "concise", "professional", "warm"] as Tone[]).map((t) => {
            const on = prefs.tone === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
                style={{
                  borderColor: on ? "var(--ais-accent)" : "var(--ais-line)",
                  background: on ? "var(--ais-accent-bg)" : "var(--ais-surface)",
                  color: on ? "var(--ais-accent)" : "var(--ais-fg-muted)",
                }}
              >
                {TONE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Glass-Box kaynak izi — yanıtın hangi gerçek araçlarla üretildiğini gösterir.
   Kullanıcı güveni: "kara kutu değil, şu verilere dayandı". Kısa etiketler. */
const SOURCE_LABEL: Record<string, string> = {
  get_quote: "Canlı fiyat",
  get_company_profile: "Şirket profili",
  get_news: "Haberler",
  get_technicals: "Teknik analiz",
  get_sentiment: "Duyarlılık",
  get_vela_score: "Finovela Skoru",
  get_fundamentals: "Değerleme",
  compare_assets: "Karşılaştırma",
  analyze_portfolio_risk: "Portföy riski",
  whatif_simulation: "What-If simülasyonu",
  search_symbols: "Sembol arama",
  web_search: "Web araştırması",
  propose_order: "Emir önerisi",
  rebalance_portfolio: "Dengeleme",
  create_automation: "Otomasyon",
  create_alert: "Alarm",
};

function SourceTrail({ tools }: { tools: string[] }) {
  const labels = tools.map((t) => SOURCE_LABEL[t]).filter(Boolean);
  if (labels.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10.5px] font-medium text-[var(--ais-fg-faint)]">
        Kaynak:
      </span>
      {labels.map((l, i) => (
        <span
          key={`${l}-${i}`}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
          style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

const MessageRow = memo(function MessageRow({
  m,
  onRegenerate,
  onAutomation,
}: {
  m: Msg;
  onRegenerate?: () => void;
  onAutomation: (rule: string, name?: string) => void;
}) {
  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end gap-2">
        {m.attachments && m.attachments.length > 0 && (
          <div className="flex max-w-[80%] flex-wrap justify-end gap-2">
            {m.attachments.map((a, i) =>
              a.kind === "image" && a.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={a.previewUrl}
                  alt={a.name}
                  className="h-24 w-24 rounded-2xl border object-cover"
                  style={{ borderColor: "var(--ais-line)" }}
                />
              ) : (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-2xl border bg-[var(--ais-surface-2)] px-3 py-2.5"
                  style={{ borderColor: "var(--ais-line)" }}
                >
                  <FileText size={20} className="text-[var(--ais-accent)]" />
                  <span className="max-w-[160px] truncate text-xs text-[var(--ais-fg-muted)]">{a.name}</span>
                </div>
              ),
            )}
          </div>
        )}
        {m.text && (
          <div className="max-w-[80%] rounded-3xl rounded-tr-md bg-[var(--ais-accent)] px-4 py-3 text-[15px] leading-relaxed text-white">
            {m.text}
          </div>
        )}
      </div>
    );
  }
  // logo durumu: araç çalışıyorsa/ilk harf gelmediyse "düşünüyor", yazarken "writing"
  const aiState: "idle" | "thinking" | "writing" = m.streaming
    ? m.tool || !m.writing
      ? "thinking"
      : "writing"
    : "idle";

  return (
    <div className="group flex gap-3">
      <VelaAiMark size={36} state={aiState} />
      <div className="min-w-0 flex-1 space-y-3">
        {m.tool && (
          <div className="flex items-center gap-2 text-sm">
            <ThinkingShimmer label={TOOL_LABELS[m.tool] ?? "Çalışıyor"} tone="light" />
          </div>
        )}
        {m.streaming && !m.tool && !m.writing ? (
          // İlk harf gelmeden: düşünme shimmer'ı
          <div className="rounded-2xl rounded-tl-md bg-[var(--ais-surface-2)] px-4 py-3">
            <ThinkingShimmer tone="light" />
          </div>
        ) : m.streaming && !m.tool ? (
          // YAZARKEN: React/Markdown YOK — drip doğrudan bu node'a textContent yazar.
          <div className="rounded-2xl rounded-tl-md bg-[var(--ais-surface-2)] px-4 py-3">
            <span
              data-stream={m.id}
              className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ais-fg)]"
            />
            <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-[var(--ais-fg-muted)] align-middle" />
          </div>
        ) : m.text ? (
          <div className="rounded-2xl rounded-tl-md bg-[var(--ais-surface-2)] px-4 py-3">
            <Markdown text={m.text} tone="light" />
          </div>
        ) : null}
        {m.quotes && m.quotes.length > 0 && <QuoteCards quotes={m.quotes} />}
        {m.order && <OrderCardView order={m.order} />}
        {m.rebalance && <RebalanceCardView r={m.rebalance} />}
        {m.automation && <AutomationCardView a={m.automation} onConfirm={onAutomation} />}
        {m.technicals && <TechnicalsCard t={m.technicals} />}
        {m.velaScore && <ScoreCard s={m.velaScore} />}
        {m.whatif && <WhatIfCard w={m.whatif} />}
        {m.sentiment && <SentimentCard s={m.sentiment} />}
        {m.news && <NewsCard n={m.news} />}
        {m.profile && <ProfileCard p={m.profile} />}

        {/* Glass-Box: bu yanıt hangi araçlarla üretildi — şeffaflık izi. */}
        {!m.streaming && m.usedTools && m.usedTools.length > 0 && (
          <SourceTrail tools={m.usedTools} />
        )}

        {!m.streaming && m.text && (
          <>
            {/* Her mesaj altında sabit, tek satır feragat — konuşmaya yansımaz */}
            <p className="text-[11px] leading-relaxed text-[var(--ais-fg-faint)]">
              Finovela bir paper-trading (demo) asistanıdır; yatırım tavsiyesi değildir, getiri garanti edilmez.
            </p>
            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={() => navigator.clipboard?.writeText(m.text)}
                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                aria-label="Kopyala"
              >
                <Copy size={14} />
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                  aria-label="Yeniden oluştur"
                >
                  <RotateCw size={14} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

function QuoteCards({ quotes }: { quotes: QuoteCard[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {quotes.map((q) => {
        const up = q.changePct >= 0;
        return (
          <div
            key={q.symbol}
            className="flex items-center justify-between rounded-2xl border bg-[var(--ais-surface)] px-4 py-3"
            style={{ borderColor: "var(--ais-line)" }}
          >
            <div>
              <p className="font-semibold text-[var(--ais-fg)]">{q.symbol}</p>
              <p className="truncate text-xs text-[var(--ais-fg-faint)]">{q.name}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-[var(--ais-fg)] tabular-nums">{fmtUsd(q.price)}</p>
              <p className="text-xs font-medium tabular-nums" style={{ color: up ? "var(--ais-green)" : "#d93025" }}>
                {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCardView({ order }: { order: OrderProposal }) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinVal, setPinVal] = useState("");
  const total = order.shares * order.price;

  function attemptConfirm() {
    const brain = brainStore.get();

    // 1) Güven bütçesi kontrolü — Brain limitleri emir akışında ZORLANIR.
    const paper = paperStore.get();
    const portfolioValue =
      paper.cash + paper.holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);
    const startOfDay = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const todaysTrades = decisionStore
      .get()
      .filter((x) => x.kind === "trade" && x.executed && x.ts >= startOfDay).length;
    const existing = paper.holdings.find((h) => h.symbol === order.symbol);
    const resultingValue =
      (existing ? existing.shares * existing.avgCost : 0) +
      (order.side === "BUY" ? total : -total);
    const resultingPositionPct =
      portfolioValue > 0 ? Math.abs(resultingValue / portfolioValue) * 100 : 0;

    const check = checkBudget(brain, {
      tradeValue: total,
      portfolioValue,
      todaysTrades,
      resultingPositionPct,
    });
    if (!check.allowed) {
      setStatus("error");
      setError(check.reason ?? "Güven bütçesi sınırı aşıldı");
      // Engellenen işlemi karar defterine şeffaflık için işle.
      decisionStore.log({
        kind: "blocked",
        action: `${order.side === "BUY" ? "Alış" : "Satış"} ${order.symbol} engellendi`,
        rationale: check.reason ?? "Güven bütçesi sınırı",
        authority: brain.authority,
        executed: false,
      });
      return;
    }

    // 2) PIN gerekiyor mu? (güven bütçesi eşiği + PIN GERÇEKTEN kurulu)
    // isPinSet() = enabled + geçerli hash; bozuk state'te (hash yok) modal çıkmaz
    // ama çıkarsa da verifyPin boş/yanlış PIN'i reddeder.
    if (securityStore.isPinSet() && check.needsPin) {
      setPinPrompt(true);
      return;
    }
    confirm();
  }

  function submitPin() {
    if (securityStore.verifyPin(pinVal)) {
      setPinPrompt(false);
      setPinVal("");
      confirm();
    } else {
      setError("Yanlış PIN.");
    }
  }

  function confirm() {
    const r = paperStore.placeOrder({ side: order.side, symbol: order.symbol, shares: order.shares, price: order.price });
    if (r.ok) {
      setStatus("done");
      toast.success(
        `${order.side === "BUY" ? "Alış" : "Satış"} gerçekleşti`,
        `${order.shares < 1 ? order.shares.toFixed(4) : order.shares} ${order.symbol} @ ${fmtUsd(order.price)} · sanal`,
      );
      // Karar defterine işle (şeffaflık).
      decisionStore.log({
        kind: "trade",
        action: `${order.side === "BUY" ? "Alış" : "Satış"} ${order.shares < 1 ? order.shares.toFixed(4) : order.shares} ${order.symbol} @ ${fmtUsd(order.price)}`,
        rationale: order.rationale || "Finovela sohbetinde onaylanan işlem.",
        authority: brainStore.get().authority,
        executed: true,
        snapshot: { symbol: order.symbol, side: order.side, shares: order.shares, price: order.price, stop: order.stop },
      });
    } else { setStatus("error"); setError(r.error ?? "Order failed"); toast.error("İşlem başarısız", r.error ?? undefined); }
  }
  return (
    <div className="max-w-sm rounded-3xl border bg-[var(--ais-surface)] p-4" style={{ borderColor: "var(--ais-line)" }}>
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl border bg-[var(--ais-surface-2)] text-sm font-bold text-[var(--ais-fg)]"
          style={{ borderColor: "var(--ais-line)" }}
        >
          {order.symbol[0]}
        </span>
        <div className="flex-1">
          <p className="font-bold text-[var(--ais-fg)]">
            {order.side} {order.shares < 1 ? order.shares.toFixed(4) : order.shares} {order.symbol}
          </p>
          <p className="text-xs text-[var(--ais-fg-faint)]">Piyasa emri · demo işlem</p>
        </div>
        <p className="font-display text-lg font-bold text-[var(--ais-fg)] tabular-nums">{fmtUsd(order.price)}</p>
      </div>
      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between rounded-lg bg-[var(--ais-surface-2)] px-3 py-2">
          <span className="text-[var(--ais-fg-faint)]">Tahmini toplam</span>
          <span className="font-semibold text-[var(--ais-fg)] tabular-nums">{fmtUsd(total)}</span>
        </div>
        {order.stop && (
          <div className="flex items-center justify-between rounded-lg bg-[var(--ais-surface-2)] px-3 py-2">
            <span className="text-[var(--ais-fg-faint)]">Zarar durdur</span>
            <span className="font-semibold tabular-nums" style={{ color: "#d93025" }}>{fmtUsd(order.stop)}</span>
          </div>
        )}
      </div>
      {status === "done" ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[var(--ais-green-bg)] py-2.5 text-sm font-semibold text-[var(--ais-green)]">
          <CheckCircle2 size={16} /> Emir gerçekleşti
        </div>
      ) : status === "error" && !pinPrompt ? (
        <div className="mt-3 rounded-xl bg-[#d93025]/12 py-2.5 text-center text-sm font-semibold text-[#d93025]">{error}</div>
      ) : pinPrompt ? (
        <div className="mt-3 space-y-2">
          <p className="text-center text-xs text-[var(--ais-fg-muted)]">Yüksek tutarlı işlem — PIN gir</p>
          <input
            value={pinVal}
            onChange={(e) => { setPinVal(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="PIN"
            className="w-full rounded-xl border bg-[var(--ais-surface)] px-3 py-2.5 text-center text-lg tracking-[0.4em] text-[var(--ais-fg)] focus:border-[var(--ais-accent)] focus:outline-none"
            style={{ borderColor: "var(--ais-line-strong)" }}
          />
          {error && <p className="text-center text-xs text-[#d93025]">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setPinPrompt(false); setPinVal(""); setError(""); }} className="flex-1 rounded-xl border py-2 text-sm font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]" style={{ borderColor: "var(--ais-line-strong)" }}>
              Vazgeç
            </button>
            <button onClick={submitPin} className="flex-1 rounded-xl bg-[var(--ais-accent)] py-2 text-sm font-bold text-white transition hover:opacity-90">
              Onayla
            </button>
          </div>
        </div>
      ) : (
        <button onClick={attemptConfirm} className="mt-3 w-full rounded-xl bg-[var(--ais-accent)] py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          {order.side === "BUY" ? "Alımı onayla" : "Satışı onayla"}
        </button>
      )}
    </div>
  );
}

function RebalanceCardView({ r }: { r: RebalanceProposal }) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const net = r.orders.reduce((s, o) => s + o.shares * o.price * (o.side === "BUY" ? -1 : 1), 0);

  function confirmAll() {
    // ÖNEMLİ: Önce SATIŞLAR, sonra ALIMLAR. Aksi halde alımlar, henüz gerçekleşmemiş
    // satışlardan gelecek nakdi bekleyemez ve "Insufficient cash" alınır. Satışlar
    // nakdi serbest bırakır, sonra alımlar o nakitle yapılır.
    const ordered = [...r.orders].sort((a, b) => {
      if (a.side === b.side) return 0;
      return a.side === "SELL" ? -1 : 1;
    });
    for (const o of ordered) {
      const res = paperStore.placeOrder({ side: o.side, symbol: o.symbol, shares: o.shares, price: o.price });
      if (!res.ok) { setStatus("error"); setError(`${o.symbol}: ${res.error}`); return; }
    }
    setStatus("done");
    decisionStore.log({
      kind: "rebalance",
      action: `Portföy dengelendi — ${r.orders.length} işlem`,
      rationale: r.summary || "Finovela sohbetinde onaylanan dengeleme planı.",
      authority: brainStore.get().authority,
      executed: true,
      snapshot: { orders: r.orders },
    });
  }

  return (
    <div className="max-w-md rounded-3xl border bg-[var(--ais-surface)] p-4" style={{ borderColor: "var(--ais-line)" }}>
      <p className="text-xs uppercase tracking-wide text-[var(--ais-fg-faint)]">Rebalance planı</p>
      {r.summary && <p className="mt-1.5 text-sm text-[var(--ais-fg-muted)]">{r.summary}</p>}
      <div className="mt-3 space-y-1.5">
        {r.orders.map((o, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--ais-surface-2)] px-3 py-2 text-sm">
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-bold"
              style={{
                background: o.side === "BUY" ? "var(--ais-green-bg)" : "rgba(217,48,37,0.12)",
                color: o.side === "BUY" ? "var(--ais-green)" : "#d93025",
              }}
            >
              {o.side}
            </span>
            <span className="font-semibold text-[var(--ais-fg)]">{o.symbol}</span>
            <span className="text-[var(--ais-fg-muted)] tabular-nums">
              {o.shares < 1 ? o.shares.toFixed(4) : o.shares} @ {fmtUsd(o.price)}
            </span>
            <span className="ml-auto font-medium text-[var(--ais-fg)] tabular-nums">{fmtUsd(o.shares * o.price)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--ais-surface-2)] px-3 py-2 text-xs">
        <span className="text-[var(--ais-fg-faint)]">Net nakit etkisi</span>
        <span className="font-semibold tabular-nums" style={{ color: net >= 0 ? "var(--ais-green)" : "#d93025" }}>
          {net >= 0 ? "+" : ""}{fmtUsd(net)}
        </span>
      </div>
      {status === "done" ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[var(--ais-green-bg)] py-2.5 text-sm font-semibold text-[var(--ais-green)]">
          <CheckCircle2 size={16} /> Dengeleme uygulandı
        </div>
      ) : status === "error" ? (
        <div className="mt-3 rounded-xl bg-[#d93025]/12 py-2.5 text-center text-sm font-semibold text-[#d93025]">{error}</div>
      ) : (
        <button onClick={confirmAll} className="mt-3 w-full rounded-xl bg-[var(--ais-accent)] py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          Tümünü onayla ({r.orders.length})
        </button>
      )}
    </div>
  );
}

function AutomationCardView({ a, onConfirm }: { a: AutomationProposal; onConfirm: (rule: string, name?: string) => void }) {
  const [done, setDone] = useState(false);
  return (
    <div className="max-w-sm rounded-3xl border bg-[var(--ais-surface)] p-4" style={{ borderColor: "var(--ais-line)" }}>
      <p className="text-xs uppercase tracking-wide text-[var(--ais-fg-faint)]">Yeni otomasyon</p>
      <p className="mt-1.5 font-medium text-[var(--ais-fg)]">&ldquo;{a.rule}&rdquo;</p>
      {done ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[var(--ais-green-bg)] py-2.5 text-sm font-semibold text-[var(--ais-green)]">
          <CheckCircle2 size={16} /> Otomasyon kuruldu
        </div>
      ) : (
        <button
          onClick={() => { onConfirm(a.rule, a.name); setDone(true); }}
          className="mt-3 w-full rounded-xl bg-[var(--ais-accent)] py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          Otomasyonu kur
        </button>
      )}
    </div>
  );
}
