"use client";

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTitle, SectionCard, Card, Btn, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
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
  ChatCircle,
  Repeat,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  PaperPlaneTilt,
  Fire,
  Minus,
  Check,
  Users,
} from "@phosphor-icons/react";

const UP = AIS_UP;
const DOWN = AIS_DOWN;

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
      className="grid shrink-0 place-items-center rounded-full border border-[var(--ais-line-strong)] font-medium text-[var(--ais-fg)]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
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
      style={{ background: `${color}1f`, color }}
    >
      {up ? <TrendUp size={12} weight="regular" /> : <TrendDown size={12} weight="regular" />}
      {up ? "Yükseliş" : "Düşüş"} ${ticker}
    </span>
  );
}

function ToneBadge({ tone }: { tone: "positive" | "neutral" | "negative" }) {
  const map = {
    positive: { color: UP, label: "Olumlu", icon: <TrendUp size={11} weight="regular" /> },
    negative: { color: DOWN, label: "Olumsuz", icon: <TrendDown size={11} weight="regular" /> },
    neutral: { color: "#9a9aa0", label: "Nötr", icon: <Minus size={11} weight="regular" /> },
  } as const;
  const t = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `${t.color}1a`, color: t.color }}
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
    <div className="ais-card absolute left-0 top-full z-30 mt-1 w-64 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <Avatar name={user.name} size={42} />
        {!isMe && (
          <button
            onClick={() => feed.toggleFollow(user.id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition"
            style={
              following
                ? { borderColor: `${UP}66`, color: UP }
                : { borderColor: "var(--ais-line-strong)", color: "var(--ais-fg)" }
            }
          >
            {following ? (
              <>
                <Check size={12} weight="regular" /> Takipte
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
    <Card hover>
      {reposter && (
        <p className="mb-2.5 flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
          <Repeat size={13} weight="regular" />
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ais-line-strong)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--ais-fg-muted)]">
            <CurrencyDollar size={12} weight="regular" className="text-[var(--ais-fg)]" />
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
          <Heart size={16} weight={liked ? "fill" : "regular"} />
          <span className="num">{fmtNum(feed.likeCount(post))}</span>
        </button>
        <button
          onClick={() => setCommenting((v) => !v)}
          className="flex items-center gap-1.5 transition hover:text-[var(--ais-fg)]"
          style={commenting ? { color: "var(--ais-fg)" } : undefined}
        >
          <ChatCircle size={16} weight={commenting ? "fill" : "regular"} />
          <span className="num">{fmtNum(post.comments.length)}</span>
        </button>
        <button
          onClick={() => feed.toggleRepost(post.id)}
          className="flex items-center gap-1.5 transition hover:text-[var(--ais-fg)]"
          style={reposted ? { color: UP } : undefined}
        >
          <Repeat size={16} weight={reposted ? "fill" : "regular"} />
          <span className="num">{fmtNum(feed.repostCount(post))}</span>
        </button>
      </div>

      {/* yorumlar — kalıcı */}
      {(commenting || post.comments.length > 0) && (
        <div className="mt-4 space-y-3 border-t border-[var(--ais-line)] pt-4">
          {post.comments.map((c) => {
            const cu = feed.userById(c.authorId);
            return (
              <div key={c.id} className="flex gap-2.5">
                <Avatar name={cu.name} size={28} />
                <div className="min-w-0 rounded-xl bg-[var(--ais-surface-2)] px-3 py-2 text-[13px] text-[var(--ais-fg-muted)]">
                  <span className="mr-1.5 text-[12px] font-medium text-[var(--ais-fg)]">
                    {cu.name}
                  </span>
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
                <PaperPlaneTilt size={14} weight="regular" />
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
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
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Akış"
            desc="Yatırımcıları takip et, fikirleri beğen, yorumla ve repostla — en iyi performans gösterenleri yakala."
          />

          <DemoCommunityNotice kind="feed" />

          <div className="grid gap-3 lg:grid-cols-3">
            {/* ana akış */}
            <div className="space-y-3 lg:col-span-2">
              {/* composer */}
              <Card>
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
                    <div className="mt-2 flex items-center justify-between border-t border-[var(--ais-line)] pt-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
                        <CurrencyDollar size={13} weight="regular" />
                        $NVDA gibi bir $cashtag etiketinden bahsedin
                      </span>
                      <Btn variant="primary" onClick={publish} disabled={!draft.trim()}>
                        <PaperPlaneTilt size={14} weight="regular" />
                        Paylaş
                      </Btn>
                    </div>
                  </div>
                </div>
              </Card>

              {feed.state.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* kenar çubuğu */}
            <div className="space-y-3">
              <SectionCard
                label="Takip edilecekler"
                action={<Users size={16} weight="regular" className="text-[var(--ais-fg-faint)]" />}
              >
                {suggestions.length === 0 ? (
                  <p className="py-4 text-center text-[12.5px] text-[var(--ais-fg-faint)]">
                    Herkesi takip ediyorsun.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {suggestions.map((u) => (
                      <div key={u.id} className="ais-row flex items-center gap-3 px-2 py-2.5">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar name={u.name} size={34} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-[var(--ais-fg)]">
                              {u.name}
                            </p>
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
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition"
                          style={{
                            borderColor: "var(--ais-line-strong)",
                            color: "var(--ais-fg)",
                          }}
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
              </SectionCard>

              <SectionCard
                label="Gündemde"
                action={<Fire size={16} weight="regular" className="text-[var(--ais-fg-faint)]" />}
              >
                <div className="space-y-4">
                  {TRENDING.map((t) => (
                    <Link
                      key={t.ticker}
                      href={`/dashboard/stock/${t.ticker}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[var(--ais-fg)]">${t.ticker}</span>
                        <span
                          className="num text-[12px]"
                          style={{ color: t.bullish >= 50 ? UP : DOWN }}
                        >
                          %{t.bullish} yükseliş
                        </span>
                      </div>
                      <div
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,0.10)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${t.bullish}%`,
                            background: t.bullish >= 50 ? UP : DOWN,
                          }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
