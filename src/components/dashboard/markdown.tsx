"use client";

import React from "react";

/**
 * Hafif markdown renderer (bağımlılıksız).
 * Destekler: # ## ### başlık, **bold**, *italic*, `code`, ``` blok ```,
 * - / * / 1. liste, | tablo |, > alıntı, --- ayraç.
 *
 * tone="dark"  → Vela chat (koyu zemin, beyaz metin) — VARSAYILAN, dokunma.
 * tone="light" → Didit açık-tema kartlar (token renkler, beyaz-üstü-beyaz olmaz).
 */
export type MarkdownTone = "dark" | "light";

type Palette = {
  root: string;
  strong: string;
  code: string;
  codeBlock: string;
  heading: string;
  hr: string;
  quote: string;
  bullet: string;
  tableHead: string;
  tableHeadBorder: string;
  tableRow: string;
  tableDivide: string;
};

const PALETTES: Record<MarkdownTone, Palette> = {
  dark: {
    root: "text-white/90",
    strong: "font-semibold text-white",
    code: "rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-white",
    codeBlock: "overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04] p-3 font-mono text-[13px] text-white/85",
    heading: "text-white",
    hr: "border-white/[0.08]",
    quote: "border-l-2 border-white/20 pl-3 text-white/65",
    bullet: "mt-[2px] shrink-0 text-white/40",
    tableHead: "border-b border-white/[0.12] text-left text-white/55",
    tableHeadBorder: "",
    tableRow: "text-white/80",
    tableDivide: "divide-y divide-white/[0.06]",
  },
  light: {
    root: "text-[var(--ais-fg)]",
    strong: "font-semibold text-[var(--ais-fg)]",
    code: "rounded bg-[var(--ais-surface-2)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--ais-fg)]",
    codeBlock: "overflow-x-auto rounded-xl border p-3 font-mono text-[13px] text-[var(--ais-fg)] border-[var(--ais-line)] bg-[var(--ais-surface-2)]",
    heading: "text-[var(--ais-fg)]",
    hr: "border-[var(--ais-line)]",
    quote: "border-l-2 border-[var(--ais-line-strong)] pl-3 text-[var(--ais-fg-muted)]",
    bullet: "mt-[2px] shrink-0 text-[var(--ais-fg-faint)]",
    tableHead: "border-b text-left text-[var(--ais-fg-muted)] border-[var(--ais-line)]",
    tableHeadBorder: "",
    tableRow: "text-[var(--ais-fg)]",
    tableDivide: "divide-y divide-[var(--ais-line)]",
  },
};

export function Markdown({ text, tone = "dark" }: { text: string; tone?: MarkdownTone }) {
  const p = PALETTES[tone];
  const blocks = parseBlocks(text, p);
  return <div className={`space-y-3 text-[15px] leading-relaxed ${p.root}`}>{blocks}</div>;
}

function inline(s: string, keyBase: string, p: Palette): React.ReactNode[] {
  // `code`, **bold**, *italic* — sırayla
  const out: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      out.push(
        <code key={`${keyBase}-${i}`} className={p.code}>
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyBase}-${i}`} className={p.strong}>
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <em key={`${keyBase}-${i}`} className="italic">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function parseBlocks(text: string, p: Palette): React.ReactNode[] {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // kod bloğu
    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // kapanış ```
      blocks.push(
        <pre key={key++} className={p.codeBlock}>
          {buf.join("\n")}
        </pre>,
      );
      continue;
    }

    // tablo
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key++} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={p.tableHead}>
                {header.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 font-medium">{inline(h, `th${key}-${hi}`, p)}</th>
                ))}
              </tr>
            </thead>
            <tbody className={p.tableDivide}>
              {rows.map((r, ri) => (
                <tr key={ri} className={p.tableRow}>
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 tabular-nums">{inline(c, `td${key}-${ri}-${ci}`, p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // başlık
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls =
        level <= 2
          ? `font-display text-lg font-bold ${p.heading}`
          : `font-display text-base font-bold ${p.heading}`;
      blocks.push(
        <p key={key++} className={`${cls} ${level <= 2 ? "mt-1" : ""}`}>
          {inline(h[2], `h${key}`, p)}
        </p>,
      );
      i++;
      continue;
    }

    // ayraç
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push(<hr key={key++} className={p.hr} />);
      i++;
      continue;
    }

    // alıntı
    if (line.trim().startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={key++} className={p.quote}>
          {inline(buf.join(" "), `bq${key}`, p)}
        </blockquote>,
      );
      continue;
    }

    // liste (sırasız/sıralı)
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items: { ordered: boolean; text: string }[] = [];
      let ordered = /^\s*\d+\./.test(line);
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        const ol = /^\s*\d+\./.test(lines[i]);
        ordered = ordered && ol;
        items.push({ ordered: ol, text: lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "") });
        i++;
      }
      const inner = items.map((it, idx) => (
        <li key={idx} className="flex gap-2">
          <span className={p.bullet}>{it.ordered ? `${idx + 1}.` : "•"}</span>
          <span>{inline(it.text, `li${key}-${idx}`, p)}</span>
        </li>
      ));
      blocks.push(
        <ul key={key++} className="space-y-1.5">
          {inner}
        </ul>,
      );
      continue;
    }

    // boş satır
    if (!line.trim()) {
      i++;
      continue;
    }

    // normal paragraf (ardışık metin satırlarını birleştir)
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith(">") &&
      !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && lines[i + 1].includes("-") && lines[i + 1].includes("|"))
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="whitespace-pre-wrap">
        {inline(buf.join("\n"), `p${key}`, p)}
      </p>,
    );
  }

  return blocks;
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}
