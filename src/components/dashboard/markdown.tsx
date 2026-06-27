"use client";

import React from "react";

/**
 * Hafif markdown renderer (bağımlılıksız) — Vela chat için.
 * Destekler: # ## ### başlık, **bold**, *italic*, `code`, ``` blok ```,
 * - / * / 1. liste, | tablo |, > alıntı, --- ayraç. Monokrom tema.
 */
export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return <div className="space-y-3 text-[15px] leading-relaxed text-white/90">{blocks}</div>;
}

function inline(s: string, keyBase: string): React.ReactNode[] {
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
        <code key={`${keyBase}-${i}`} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-white">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyBase}-${i}`} className="font-semibold text-white">
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

function parseBlocks(text: string): React.ReactNode[] {
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
        <pre key={key++} className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04] p-3 font-mono text-[13px] text-white/85">
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
              <tr className="border-b border-white/[0.12] text-left text-white/55">
                {header.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 font-medium">{inline(h, `th${key}-${hi}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {rows.map((r, ri) => (
                <tr key={ri} className="text-white/80">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 tabular-nums">{inline(c, `td${key}-${ri}-${ci}`)}</td>
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
          ? "font-display text-lg font-bold text-white"
          : "font-display text-base font-bold text-white";
      blocks.push(
        <p key={key++} className={`${cls} ${level <= 2 ? "mt-1" : ""}`}>
          {inline(h[2], `h${key}`)}
        </p>,
      );
      i++;
      continue;
    }

    // ayraç
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="border-white/[0.08]" />);
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
        <blockquote key={key++} className="border-l-2 border-white/20 pl-3 text-white/65">
          {inline(buf.join(" "), `bq${key}`)}
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
          <span className="mt-[2px] shrink-0 text-white/40">{it.ordered ? `${idx + 1}.` : "•"}</span>
          <span>{inline(it.text, `li${key}-${idx}`)}</span>
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
        {inline(buf.join("\n"), `p${key}`)}
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
