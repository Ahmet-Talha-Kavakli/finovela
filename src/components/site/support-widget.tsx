"use client";

/**
 * Canlı destek widget'i — sol-alt floating, Gemini-zekalı ("Fin"), animasyonlu.
 * Her sayfada görünür (site + dashboard). /api/support'a streaming bağlanır.
 * Finovela Sohbet'ten (Anthropic) AYRIDIR: bu yalnızca ürün/destek soruları.
 *
 * Tasarım: Didit açık-tema, yumuşak kenarlar, sade başlık (gereksiz etiket yok),
 * sesli mesaj (Web Speech API). Hidrasyon-güvenli mount.
 */

import { useEffect, useRef, useState, useSyncExternalStore, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Mic } from "lucide-react";

type Msg = { id: number; role: "user" | "assistant"; text: string; streaming?: boolean };

const GREETING =
  "Merhaba! Ben Fin, Finovela destek asistanı. Nasıl çalıştığımız, planlar, hesap veya güvenlik — ne istersen sor. 👋";

// Client mount guard (SSR'da render etme — fixed widget hidrasyon gürültüsü olmasın).
const emptySub = () => () => {};
function useIsClient() {
  return useSyncExternalStore(emptySub, () => true, () => false);
}

export function SupportWidget() {
  const isClient = useIsClient();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "assistant", text: GREETING },
  ]);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<SpeechRecognition | null>(null);

  // Açılınca en alta in + inputa odaklan.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open, messages.length]);

  // Sesli giriş (Web Speech API) — transkripti kutuya yazar, otomatik göndermez.
  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return; // voiceSupported zaten false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı yeteneği bir kez saptanır (mount-time feature detection)
    setVoiceSupported(true);
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "tr-TR";
    r.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        inputRef.current?.focus();
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    return () => {
      try { r.abort(); } catch { /* yok say */ }
      recogRef.current = null;
    };
  }, []);

  const toggleVoice = useCallback(() => {
    const r = recogRef.current;
    if (!r) return;
    if (listening) {
      try { r.stop(); } catch { /* yok say */ }
      setListening(false);
    } else {
      setInput("");
      try {
        r.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }, [listening]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const userId = ++idRef.current;
    const aiId = ++idRef.current;
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((arr) => [
      ...arr,
      { id: userId, role: "user", text },
      { id: aiId, role: "assistant", text: "", streaming: true },
    ]);
    setInput("");
    setBusy(true);

    const patch = (fn: (m: Msg) => Msg) =>
      setMessages((arr) => arr.map((m) => (m.id === aiId ? fn(m) : m)));

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...history, { role: "user", content: text }] }),
      });
      if (!res.ok || !res.body) {
        patch((m) => ({ ...m, streaming: false, text: "Şu an yanıt veremiyorum, birazdan tekrar dene." }));
        setBusy(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";
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
          try {
            const data = JSON.parse(dataLine);
            if (ev === "text") {
              full += data.delta;
              patch((m) => ({ ...m, text: full }));
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }
          } catch {
            /* kısmi chunk */
          }
        }
      }
      patch((m) => ({ ...m, streaming: false, text: full || "…" }));
    } catch {
      patch((m) => ({ ...m, streaming: false, text: "Bağlantı koptu, tekrar dener misin?" }));
    } finally {
      setBusy(false);
    }
  }

  if (!isClient) return null;

  return (
    <div className="ais ais-light fixed bottom-5 left-5 z-[90] flex flex-col items-start gap-3">
      {/* Sohbet penceresi */}
      {open && (
        <div
          className="flex h-[480px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[28px] border bg-[var(--ais-surface)] shadow-[0_24px_70px_-20px_rgba(0,0,0,0.30)]"
          style={{ borderColor: "var(--ais-line)", animation: "support-pop 0.18s ease-out" }}
        >
          {/* Başlık — sade: sadece Fin + kapat */}
          <div
            className="flex items-center gap-3 border-b px-4 py-3.5"
            style={{ borderColor: "var(--ais-line)" }}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
            >
              <Sparkles size={17} fill="currentColor" />
            </span>
            <p className="flex-1 text-[14px] font-semibold text-[var(--ais-fg)]">Fin</p>
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-[var(--ais-fg-faint)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mesajlar */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] whitespace-pre-wrap rounded-[20px] px-3.5 py-2.5 text-[13px] leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "var(--ais-accent)", color: "#fff" }
                      : { background: "var(--ais-surface-2)", color: "var(--ais-fg)" }
                  }
                >
                  {m.text || (m.streaming ? "…" : "")}
                  {m.streaming && m.text && (
                    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current align-middle" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Girdi — yumuşak hap + sesli mesaj */}
          <div className="px-3 pb-3 pt-1">
            <div
              className="flex items-center gap-1 rounded-full border px-2"
              style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={listening ? "Dinliyorum…" : "Bir soru yaz…"}
                className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-[var(--ais-fg)] outline-none placeholder:text-[var(--ais-fg-faint)]"
              />
              {voiceSupported && (
                <button
                  onClick={toggleVoice}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition"
                  style={
                    listening
                      ? { background: "#d93025", color: "#fff" }
                      : { color: "var(--ais-fg-muted)" }
                  }
                  aria-label={listening ? "Dinlemeyi durdur" : "Sesli mesaj"}
                  title={listening ? "Dinlemeyi durdur" : "Sesli mesaj"}
                >
                  <Mic size={16} className={listening ? "animate-pulse" : ""} />
                </button>
              )}
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40"
                style={{ background: "var(--ais-accent)" }}
                aria-label="Gönder"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Açma balonu — pencere açıkken gizlenir (kapatma zaten başlıktaki X). */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_12px_32px_-8px_rgba(37,103,255,0.6)] transition hover:scale-105 active:scale-95"
          style={{ background: "var(--ais-accent)" }}
          aria-label="Canlı destek"
        >
          <span className="relative">
            <MessageCircle size={24} fill="currentColor" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ais-green)] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--ais-green)]" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
