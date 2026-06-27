"use client";

/**
 * Finovela Akış — sosyal yatırım akışı: gönderiler, beğeni/yorum/repost, takip.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, satır deseni, token renkleri, Lucide ikonlar.
 */

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { DemoCommunityNotice } from "@/components/dashboard/demo-community-notice";
import { fmtNum } from "@/lib/dashboard/data";
import { newsSentiment } from "@/lib/dashboard/sentiment";
import {
  useFeed,
  relTime,
  type Post,
  type FeedUser,
  type Sentiment,
} from "@/lib/dashboard/use-feed";
import {
  Heart,
  MessageCircle,
  Repeat2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Send,
  Flame,
  Minus,
  Check,
  Users,
} from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";
const NEUTRAL = "var(--ais-fg-faint)";

const TRENDING = [
  { ticker: "NVDA", bullish: 82 },
  { ticker: "TSLA", bullish: 41 },
  { ticker: "PLTR", bullish: 74 },
  { ticker: "META", bullish: 78 },
  { ticker: "AMD", bullish: 63 },
  { ticker: "SPY", bullish: 69 },
];

/** $TICKER cashtag'lerini mavi, tıklanır link yap (→ /dashboard/stock/SYM). */
function renderBody(text: string) {
  return text.split(/(\$[A-Z]{1,5})/g).map((chunk, i) => {
    if (/^\$[A-Z]{1,5}$/.test(chunk)) {
      const sym = chunk.slice(1);
      return (
        <Link
          key={i}
          href={`/dashboard/stock/${sym}`}
          className="font-medium text-[var(--ais-accent)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {chunk}
        </Link>
      );
    }
    return <span key={i}>{chunk}</span>;
  });
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full border font-medium text-[var(--ais-fg)]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        borderColor: "var(--ais-line-strong)",
        background: "var(--ais-surface-2)",
      }}
    >
      {name[0]}
    </span>
  );
}

function SentimentBadge({ ticker, dir }: { ticker: string; dir: Sentiment }) {
  const up = dir === "bullish";
  const color = up ? UP : DOWN;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: up ? "var(--ais-green-bg)" : "rgba(217,48,37,0.10)", color }}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "Yükseliş" : "Düşüş"} ${ticker}
    </span>
  );
}

function ToneBadge({ tone }: { tone: "positive" | "neutral" | "negative" }) {
  const map = {
    positive: { color: UP, bg: "var(--ais-green-bg)", label: "Olumlu", icon: <TrendingUp size={11} /> },
    negative: { color: DOWN, bg: "rgba(217,48,37,0.10)", label: "Olumsuz", icon: <TrendingDown size={11} /> },
    neutral: { color: NEUTRAL, bg: "var(--ais-surface-2)", label: "Nötr", icon: <Minus size={11} /> },
  } as const;
  const t = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: t.bg, color: t.color }}
    >
      {t.icon}
      {t.label} hava
    </span>
  );
}

/** Yazar adı/handle'ına hover edince çıkan mini profil kartı. */
function AuthorPopover({ user }: { user: FeedUser }) {
  const feed = useFeed();
  const following = feed.isFollowing(user.id);
  const isMe = user.id === "me";
  return (
    <div
      className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border p-4 shadow-[0_16px_40px_-16px_rgba(26,26,26,0.2)]"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <Avatar name={user.name} size={42} />
        {!isMe && (
          <button
            onClick={() => feed.toggleFollow(user.id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition"
            style={
              following
                ? { borderColor: "rgba(15,125,74,0.4)", color: UP }
                : { borderColor: "var(--ais-line-strong)", color: "var(--ais-fg)" }
            }
          >
            {following ? (
              <>
                <Check size={12} /> Takipte
              </>
            ) : (
              "Takip et"
            )}
          </button>
        )}
      </div>
      <p className="mt-2.5 text-[13.5px] font-medium text-[var(--ais-fg)]">{user.name}</p>
      <p className="text-[12px] text-[var(--ais-fg-faint)]">{user.handle}</p>
      {user.bio && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">{user.bio}</p>
      )}
      <div className="mt-3 flex items-center gap-4 text-[12px] text-[var(--ais-fg-muted)]">
        <span>
          <span className="num font-medium text-[var(--ais-fg)]">{fmtNum(user.followers)}</span> takipçi
        </span>
        {typeof user.return1y === "number" && (
          <span className="num font-medium" style={{ color: UP }}>
            +{user.return1y}% / 1y
          </span>
        )}
      </div>
    </div>
  );
}

function AuthorLine({ user, time }: { user: FeedUser; time: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center gap-3">
      <Avatar name={user.name} />
      <div
        className="relative min-w-0"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <p className="truncate text-[13px] font-medium text-[var(--ais-fg)]">
          <span className="cursor-pointer hover:underline">{user.name}</span>{" "}
          <span className="font-normal text-[var(--ais-fg-faint)]">
            {user.handle} · {relTime(time)}
          </span>
        </p>
        <p className="text-[11.5px] text-[var(--ais-fg-faint)]">Yatırımcı</p>
        {open && <AuthorPopover user={user} />}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const feed = useFeed();
  const author = feed.userById(post.authorId);
  const [commenting, setCommenting] = useState(false);
  const [draft, setDraft] = useState("");

  const liked = feed.isLiked(post.id);
  const reposted = feed.isReposted(post);
  const tone = newsSentiment(post.text);

  const reposter = post.repostBy ? feed.userById(post.repostBy) : null;

  function submitComment() {
    const t = draft.trim();
    if (!t) return;
    feed.addComment(post.id, t);
    setDraft("");
  }

  return (
    <div
      className="rounded-xl border p-5 transition hover:bg-[var(--ais-surface-2)]"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      {reposter && (
        <p className="mb-2.5 flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
          <Repeat2 size={13} />
          {reposter.id === "me" ? "Sen repostladın" : `${reposter.name} repostladı`}
        </p>
      )}

      <AuthorLine user={author} time={post.createdAt} />

      <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ais-fg-muted)]">
        {renderBody(post.text)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ToneBadge tone={tone} />
        {post.sentiment && <SentimentBadge ticker={post.sentiment.ticker} dir={post.sentiment.dir} />}
        {post.position && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-[var(--ais-fg-muted)]"
            style={{ borderColor: "var(--ais-line-strong)" }}
          >
            <DollarSign size={12} className="text-[var(--ais-fg)]" />
            {post.position.action}{" "}
            <span className="font-medium text-[var(--ais-fg)]">${post.position.ticker}</span>
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-6 text-[12.5px] text-[var(--ais-fg-faint)]">
        <button
          onClick={() => feed.toggleLike(post.id)}
          className="flex items-center gap-1.5 transition hover:text-[var(--ais-fg)]"
          style={liked ? { color: DOWN } : undefined}
        >
          <Heart size={16} fill={liked ? DOWN : "none"} />
          <span className="num">{fmtNum(feed.likeCount(post))}</span>
        </button>
        <button
          onClick={() => setCommenting((v) => !v)}
          className="flex items-center gap-1.5 transition hover:text-[var(--ais-fg)]"
          style={commenting ? { color: "var(--ais-fg)" } : undefined}
        >
          <MessageCircle size={16} />
          <span className="num">{fmtNum(post.comments.length)}</span>
        </button>
        <button
          onClick={() => feed.toggleRepost(post.id)}
          className="flex items-center gap-1.5 transition hover:text-[var(--ais-fg)]"
          style={reposted ? { color: UP } : undefined}
        >
          <Repeat2 size={16} />
          <span className="num">{fmtNum(feed.repostCount(post))}</span>
        </button>
      </div>

      {/* yorumlar — kalıcı */}
      {(commenting || post.comments.length > 0) && (
        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--ais-line)" }}>
          {post.comments.map((c) => {
            const cu = feed.userById(c.authorId);
            return (
              <div key={c.id} className="flex gap-2.5">
                <Avatar name={cu.name} size={28} />
                <div className="min-w-0 rounded-xl bg-[var(--ais-surface-2)] px-3 py-2 text-[13px] text-[var(--ais-fg-muted)]">
                  <span className="mr-1.5 text-[12px] font-medium text-[var(--ais-fg)]">{cu.name}</span>
                  <span className="text-[11px] text-[var(--ais-fg-faint)]">{relTime(c.time)}</span>
                  <p className="mt-0.5">{c.text}</p>
                </div>
              </div>
            );
          })}
          {commenting && (
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitComment();
                  }
                }}
                placeholder="Bir yanıt yazın…"
                className="ais-input flex-1"
              />
              <button
                onClick={submitComment}
                disabled={!draft.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--ais-accent)] transition disabled:opacity-30"
                style={{ background: "var(--ais-accent-bg)" }}
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const feed = useFeed();
  const [draft, setDraft] = useState("");

  function publish() {
    const text = draft.trim();
    if (!text) return;
    const m = text.match(/\$([A-Z]{1,5})/);
    feed.publish({ text, cashtag: m ? m[1] : undefined });
    setDraft("");
  }

  // Takip edilebilecek (henüz takip edilmeyen) kullanıcılar
  const suggestions = feed.state.users
    .filter((u) => !feed.isFollowing(u.id))
    .sort((a, b) => (b.return1y ?? 0) - (a.return1y ?? 0))
    .slice(0, 5);

  return (
    <>
      <Topbar title="Akış" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Akış</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Yatırımcıları takip et, fikirleri beğen, yorumla ve repostla — en iyi performans
              gösterenleri yakala.
            </p>
          </div>

          <div className="mt-6">
            <DemoCommunityNotice kind="feed" />
          </div>

          <div className="mt-9 grid gap-8 border-t pt-8 lg:grid-cols-3" style={{ borderColor: "var(--ais-line)" }}>
            {/* ana akış */}
            <div className="space-y-3 lg:col-span-2">
              {/* composer */}
              <div
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <div className="flex gap-3">
                  <Avatar name="Sen" />
                  <div className="flex-1">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Bir fikir paylaşın…"
                      rows={2}
                      className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
                    />
                    <div className="mt-2 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--ais-line)" }}>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
                        <DollarSign size={13} />
                        $NVDA gibi bir $cashtag etiketinden bahsedin
                      </span>
                      <button
                        onClick={publish}
                        disabled={!draft.trim()}
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: "var(--ais-accent)" }}
                      >
                        <Send size={14} />
                        Paylaş
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {feed.state.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* kenar çubuğu */}
            <div className="space-y-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="d-section">Takip edilecekler</h2>
                  <Users size={16} className="text-[var(--ais-fg-faint)]" />
                </div>
                <div
                  className="rounded-xl border p-2"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                >
                  {suggestions.length === 0 ? (
                    <p className="py-4 text-center text-[12.5px] text-[var(--ais-fg-faint)]">
                      Herkesi takip ediyorsun.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {suggestions.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-[var(--ais-surface-2)]"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar name={u.name} size={34} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-[var(--ais-fg)]">{u.name}</p>
                              <p className="text-[11.5px] text-[var(--ais-fg-faint)]">
                                {u.handle}
                                {typeof u.return1y === "number" && (
                                  <>
                                    {" · "}
                                    <span className="num font-medium" style={{ color: UP }}>
                                      +{u.return1y}%
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => feed.toggleFollow(u.id)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                            style={{ borderColor: "var(--ais-line-strong)" }}
                          >
                            Takip et
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/dashboard/copy"
                    className="mt-3 block text-center text-[12px] font-medium text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
                  >
                    Tüm liderlik tablosunu gör
                  </Link>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="d-section">Gündemde</h2>
                  <Flame size={16} className="text-[var(--ais-fg-faint)]" />
                </div>
                <div
                  className="space-y-4 rounded-xl border p-5"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                >
                  {TRENDING.map((t) => (
                    <Link key={t.ticker} href={`/dashboard/stock/${t.ticker}`} className="block">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[var(--ais-fg)]">${t.ticker}</span>
                        <span className="num text-[12px]" style={{ color: t.bullish >= 50 ? UP : DOWN }}>
                          %{t.bullish} yükseliş
                        </span>
                      </div>
                      <div
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                        style={{ background: "var(--ais-surface-2)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${t.bullish}%`, background: t.bullish >= 50 ? UP : DOWN }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
