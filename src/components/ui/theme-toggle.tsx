"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition hover:text-fg hover:border-border-strong"
    >
      {mounted ? (
        isDark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
