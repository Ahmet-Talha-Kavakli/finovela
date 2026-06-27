"use client";

// Sohbet içi haber kartı — get_news tool sonucu. Başlık listesi + kaynak + sentiment noktası.

const UP = "#3ecf8e";
const DOWN = "#ff5c5c";

type NewsItem = {
  id: string;
  headline: string;
  summary?: string;
  source: string;
  url: string;
  datetime: number;
  related?: string;
  sentiment?: "positive" | "neutral" | "negative";
};

export type NewsData = { news: NewsItem[] };

function sentColor(s?: NewsItem["sentiment"]): string {
  if (s === "positive") return UP;
  if (s === "negative") return DOWN;
  return "#8ab4f8";
}

function timeAgo(unixSec: number): string {
  const diff = Date.now() / 1000 - unixSec;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} dk`;
  if (diff < 86400) return `${Math.round(diff / 3600)} sa`;
  return `${Math.round(diff / 86400)} gün`;
}

export function NewsCard({ n }: { n: NewsData }) {
  if (!n.news || n.news.length === 0) return null;
  return (
    <div className="max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wide text-white/40">Haberler</p>
      <ul className="mt-2 divide-y divide-white/[0.06]">
        {n.news.slice(0, 6).map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2.5 transition hover:opacity-80"
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: sentColor(item.sentiment) }}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug text-white/90">{item.headline}</p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {item.source}{item.related ? ` · ${item.related}` : ""} · {timeAgo(item.datetime)} önce
                  </p>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
