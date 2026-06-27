"use client";

/**
 * Vela Akış (Sosyal) deposu — gerçek bir sosyal platform çekirdeği.
 * Tamamı client-side mock + localStorage kalıcılığı (gerçek backend yok).
 *
 * Kapsam:
 *  - Kullanıcılar (profil, takipçi sayısı, takip durumu, bio)
 *  - Gönderiler (yazar, metin, cashtag, beğeni, yorumlar, repost)
 *  - Aksiyonlar: beğen, yorum yaz, repost et, takip et — hepsi kalıcı
 *  - Repost: akışta "X repostladı" etiketiyle görünür
 *
 * Persist anahtarı: vela.feed.v1
 * "vela:rehydrate" event'i ile cache sıfırlanır (diğer depolarla uyumlu).
 */

import { useSyncExternalStore } from "react";

const KEY = "vela.feed.v1";

/** Mevcut (oturum açmış) kullanıcı. */
export const ME = {
  id: "me",
  name: "Sen",
  handle: "@sen",
  bio: "Finovela ile uzun vadeli, disiplinli yatırım. Otomasyon + temel analiz.",
} as const;

export type FeedUser = {
  id: string;
  name: string;
  handle: string; // @ ile
  bio: string;
  followers: number;
  return1y?: number;
};

export type Sentiment = "bullish" | "bearish";

export type Comment = {
  id: string;
  authorId: string; // FeedUser.id veya "me"
  text: string;
  time: number; // epoch ms
};

export type Post = {
  id: string;
  authorId: string;
  text: string;
  cashtag?: string; // örn "NVDA"
  sentiment?: { ticker: string; dir: Sentiment };
  position?: { action: string; ticker: string };
  createdAt: number; // epoch ms
  likes: number; // taban beğeni (seed)
  reposts: number; // taban repost (seed)
  comments: Comment[];
  /** Repost ise: orijinal gönderiyi repostlayan kullanıcının id'si. */
  repostOf?: string; // orijinal Post.id
  repostBy?: string; // FeedUser.id
};

export type FeedState = {
  users: FeedUser[];
  posts: Post[];
  /** "me" tarafından beğenilen post id'leri. */
  likedByMe: string[];
  /** "me" tarafından repostlanan orijinal post id'leri. */
  repostedByMe: string[];
  /** "me" tarafından takip edilen kullanıcı id'leri. */
  followingByMe: string[];
};

/* ---------------------------------------------------------------- seed */

const H = 3600_000;
const M = 60_000;
const now = () => Date.now();

const SEED_USERS: FeedUser[] = [
  {
    id: "u_sarah",
    name: "Sarah Chen",
    handle: "@quantsarah",
    bio: "Kantitatif analist. Yapay zeka & yarı iletken odaklı. Bilanço avcısı.",
    followers: 18420,
    return1y: 64.2,
  },
  {
    id: "u_viktor",
    name: "Viktor Adler",
    handle: "@valuevik",
    bio: "Değer yatırımcısı. Temettü büyümesi ve sabır. Sıkıcı kazanır.",
    followers: 9110,
    return1y: 38.9,
  },
  {
    id: "u_max",
    name: "Max Rivera",
    handle: "@momentummax",
    bio: "Yüksek momentum trader. Trend dostumdur — ta ki bozulana dek.",
    followers: 24200,
    return1y: 81.5,
  },
  {
    id: "u_amy",
    name: "Amy Brooks",
    handle: "@steadyamy",
    bio: "Endeks çekirdeği + otomatik alım. Piyasada geçen zaman > zamanlama.",
    followers: 13340,
    return1y: 22.4,
  },
  {
    id: "u_jay",
    name: "Jay Okafor",
    handle: "@cryptojay",
    bio: "Kripto & altcoin. Yüksek risk, yüksek inanç. Kopya trade meraklısı.",
    followers: 19870,
    return1y: 112.7,
  },
  {
    id: "u_ian",
    name: "Ian Fletcher",
    handle: "@incomeian",
    bio: "Opsiyon geliri & kapalı alım. Her ay nakit akışı üretiyorum.",
    followers: 8210,
    return1y: 17.8,
  },
];

const SEED_POSTS: Post[] = [
  {
    id: "p1",
    authorId: "u_sarah",
    text: "$NVDA bilançosu bu akşam. Önemli olan tek kalem veri merkezi geliri — konsensüs yine aşılabilir görünüyor. Bilançoya kadar tutuyorum, eklemiyorum.",
    cashtag: "NVDA",
    sentiment: { ticker: "NVDA", dir: "bullish" },
    createdAt: now() - 12 * M,
    likes: 214,
    reposts: 22,
    comments: [
      { id: "c1a", authorId: "u_max", text: "Bilanço sonrası boşluğu beklerim, peşinden koşmam.", time: now() - 8 * M },
      { id: "c1b", authorId: "u_jay", text: "Veri merkezi rehberliği her şeyi belirler. Sabırlıyım.", time: now() - 5 * M },
    ],
  },
  {
    id: "p2",
    authorId: "u_viktor",
    text: "Herkes yapay zeka hisselerinin peşinde koşarken $KO sessizce 19x çarpanla temettüsünü büyütüyor. Sıkıcı olan onlarca yılı kazanır, haftaları değil.",
    cashtag: "KO",
    position: { action: "Aldı", ticker: "KO" },
    createdAt: now() - 47 * M,
    likes: 96,
    reposts: 8,
    comments: [
      { id: "c2a", authorId: "u_amy", text: "Tam benim tarzım. Bileşik temettü = gizli güç.", time: now() - 40 * M },
    ],
  },
  {
    id: "p3",
    authorId: "u_max",
    text: "$TSLA pozisyonumun yarısını yükselişte azalttım — teslimat söylentileri gürültü ama grafik fazla gerildi. Geliri $PLTR momentumuna çeviriyorum.",
    cashtag: "TSLA",
    sentiment: { ticker: "TSLA", dir: "bearish" },
    createdAt: now() - 1 * H,
    likes: 308,
    reposts: 44,
    comments: [
      { id: "c3a", authorId: "u_sarah", text: "PLTR değerlemesi nefes kesici ama momentum gerçek.", time: now() - 55 * M },
      { id: "c3b", authorId: "u_ian", text: "Azaltma disiplinini takdir ettim. Çoğu kişi tepeye kadar tutar.", time: now() - 50 * M },
    ],
  },
  {
    id: "p4",
    authorId: "u_amy",
    text: "Yeni yatırımcılara hatırlatma: piyasada geçirilen zaman, piyasayı zamanlamaktan üstündür. Haftalık $QQQ otomatik alımım az önce çalıştı. Stratejinin tamamı bu.",
    cashtag: "QQQ",
    position: { action: "Aldı", ticker: "QQQ" },
    createdAt: now() - 2 * H,
    likes: 451,
    reposts: 63,
    comments: [],
  },
  {
    id: "p5",
    authorId: "u_jay",
    text: "Üç hafta önce momentum stratejisini kopyaladım ve şimdiden %11 kârdayım. Disiplinli bir trader'ı yansıtmak, kendi duygusal tıklamalarımı açık ara geçiyor.",
    createdAt: now() - 3 * H,
    likes: 187,
    reposts: 19,
    comments: [
      { id: "c5a", authorId: "u_max", text: "İşte bu! Süreç > his.", time: now() - 2.5 * H },
    ],
  },
  {
    id: "p6",
    authorId: "u_ian",
    text: "Makro görüşüm: Fed bir toplantı daha faizi sabit tutarsa, temettü ödeyenler ve $SPY kalitesi tırmanmaya devam eder. Elimdeki her şeyin üzerine kapalı alım opsiyonu satıyorum.",
    cashtag: "SPY",
    sentiment: { ticker: "SPY", dir: "bullish" },
    createdAt: now() - 4 * H,
    likes: 73,
    reposts: 6,
    comments: [],
  },
  {
    id: "p7",
    authorId: "u_sarah",
    text: "Herkese içten bir soru — $AMD yapay zeka çipleri için gerçek bir ikinci kaynak mı, yoksa $NVDA fazla kalabalıklaştığında bir rahatlama hamlesi mi? Nasıl pozisyon aldığınızı merak ediyorum.",
    cashtag: "AMD",
    createdAt: now() - 5 * H,
    likes: 129,
    reposts: 7,
    comments: [
      { id: "c7a", authorId: "u_viktor", text: "Bence ikinci kaynak teması gerçek ama marjlar NVDA'yı yakalayamaz.", time: now() - 4.5 * H },
      { id: "c7b", authorId: "u_jay", text: "Küçük bir tabaka aldım, kalabalıklaşma rotasyonu için.", time: now() - 4 * H },
    ],
  },
  {
    id: "p8",
    authorId: "u_max",
    text: "$META yine sessizce dikey yükselişe geçti. Reklam geliri + yapay zeka yatırım disiplini, insanların düşündüğünden çok daha temiz bir hikaye. Hâlâ en büyük pozisyonum.",
    cashtag: "META",
    sentiment: { ticker: "META", dir: "bullish" },
    position: { action: "Tutuyor", ticker: "META" },
    createdAt: now() - 7 * H,
    likes: 242,
    reposts: 27,
    comments: [],
  },
  {
    id: "p9",
    authorId: "u_amy",
    text: "Portföy bakımı = gardırop temizliği. Bu çeyrek tezine artık inanmadığım iki pozisyonu sattım, geliri çekirdek $VOO'ya koydum. Az ve net.",
    cashtag: "VOO",
    position: { action: "Aldı", ticker: "VOO" },
    createdAt: now() - 9 * H,
    likes: 158,
    reposts: 12,
    comments: [],
  },
];

/** Seed başlangıçta "me" zaten 2 kişiyi takip ediyor olsun ki his canlı dursun. */
function seedState(): FeedState {
  return {
    users: SEED_USERS,
    posts: SEED_POSTS,
    likedByMe: [],
    repostedByMe: [],
    followingByMe: ["u_sarah", "u_max"],
  };
}

/* ---------------------------------------------------------------- store */

let cache: FeedState | null = null;
const listeners = new Set<() => void>();

const SSR: FeedState = Object.freeze(seedState());

function load(): FeedState {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FeedState>;
      const base = seedState();
      cache = {
        users: parsed.users?.length ? parsed.users : base.users,
        posts: parsed.posts?.length ? parsed.posts : base.posts,
        likedByMe: parsed.likedByMe ?? [],
        repostedByMe: parsed.repostedByMe ?? [],
        followingByMe: parsed.followingByMe ?? base.followingByMe,
      };
    } else {
      cache = seedState();
    }
  } catch {
    cache = seedState();
  }
  return cache;
}

function save(next: FeedState) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onRehydrate = () => {
    cache = null;
    cb();
  };
  if (typeof window !== "undefined") window.addEventListener("vela:rehydrate", onRehydrate);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("vela:rehydrate", onRehydrate);
  };
}

/* ---------------------------------------------------------------- actions */

export const feedStore = {
  get: load,

  toggleLike(postId: string) {
    const s = load();
    const liked = s.likedByMe.includes(postId);
    save({
      ...s,
      likedByMe: liked ? s.likedByMe.filter((id) => id !== postId) : [postId, ...s.likedByMe],
    });
  },

  addComment(postId: string, text: string) {
    const t = text.trim();
    if (!t) return;
    const s = load();
    const comment: Comment = { id: `c_${Date.now()}`, authorId: "me", text: t, time: Date.now() };
    save({
      ...s,
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p,
      ),
    });
  },

  /** Repost et / geri al. Açınca akışın başına "Sen repostladı" kartı ekler. */
  toggleRepost(postId: string) {
    const s = load();
    const orig = s.posts.find((p) => p.id === postId);
    if (!orig) return;
    const targetId = orig.repostOf ?? orig.id; // bir repost'u repostlarsan orijinale gider
    const already = s.repostedByMe.includes(targetId);

    if (already) {
      save({
        ...s,
        repostedByMe: s.repostedByMe.filter((id) => id !== targetId),
        posts: s.posts.filter((p) => !(p.repostOf === targetId && p.repostBy === "me")),
      });
      return;
    }

    const repostPost: Post = {
      id: `rp_${Date.now()}`,
      authorId: orig.repostOf ? s.posts.find((p) => p.id === targetId)!.authorId : orig.authorId,
      text: orig.repostOf ? s.posts.find((p) => p.id === targetId)!.text : orig.text,
      cashtag: orig.cashtag,
      sentiment: orig.sentiment,
      position: orig.position,
      createdAt: Date.now(),
      likes: 0,
      reposts: 0,
      comments: [],
      repostOf: targetId,
      repostBy: "me",
    };
    save({
      ...s,
      repostedByMe: [targetId, ...s.repostedByMe],
      posts: [repostPost, ...s.posts],
    });
  },

  toggleFollow(userId: string) {
    if (userId === "me") return;
    const s = load();
    const following = s.followingByMe.includes(userId);
    save({
      ...s,
      followingByMe: following
        ? s.followingByMe.filter((id) => id !== userId)
        : [userId, ...s.followingByMe],
      users: s.users.map((u) =>
        u.id === userId
          ? { ...u, followers: Math.max(0, u.followers + (following ? -1 : 1)) }
          : u,
      ),
    });
  },

  publish(input: { text: string; cashtag?: string }) {
    const text = input.text.trim();
    if (!text) return;
    const s = load();
    const post: Post = {
      id: `me_${Date.now()}`,
      authorId: "me",
      text,
      cashtag: input.cashtag,
      createdAt: Date.now(),
      likes: 0,
      reposts: 0,
      comments: [],
    };
    save({ ...s, posts: [post, ...s.posts] });
  },

  reset() {
    save(seedState());
  },
};

/* ---------------------------------------------------------------- hook */

export function useFeed() {
  const state = useSyncExternalStore(subscribe, load, () => SSR);

  /** id → kullanıcı (me dahil). */
  const userById = (id: string): FeedUser => {
    if (id === "me")
      return { ...ME, followers: 128, return1y: undefined } as FeedUser;
    return (
      state.users.find((u) => u.id === id) ?? {
        id,
        name: "Bilinmeyen",
        handle: "@bilinmeyen",
        bio: "",
        followers: 0,
      }
    );
  };

  /** Görüntülenecek beğeni sayısı (taban + me). */
  const likeCount = (p: Post) => p.likes + (state.likedByMe.includes(p.id) ? 1 : 0);

  /** Görüntülenecek repost sayısı (orijinaller için). */
  const repostCount = (p: Post) => {
    const targetId = p.repostOf ?? p.id;
    return p.reposts + (state.repostedByMe.includes(targetId) ? 1 : 0);
  };

  return {
    state,
    userById,
    likeCount,
    repostCount,
    isLiked: (postId: string) => state.likedByMe.includes(postId),
    isReposted: (p: Post) => state.repostedByMe.includes(p.repostOf ?? p.id),
    isFollowing: (userId: string) => state.followingByMe.includes(userId),
    ...feedStore,
  };
}

/* ---------------------------------------------------------------- helpers */

/** "12d", "2sa", "3g" gibi göreli zaman. */
export function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "şimdi";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}d`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}sa`;
  const day = Math.floor(hr / 24);
  return `${day}g`;
}
