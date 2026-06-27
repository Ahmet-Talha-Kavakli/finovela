import { ImageResponse } from "next/og";

// Apple touch icon (iOS ana ekran) — marka mavisi zemin + beyaz "yelken" (Vela markı).
// Next.js bunu derleme anında 180x180 PNG'ye çevirir; ekstra paket gerekmez.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3b6dff",
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path d="M16.6 4.4c5.4 4 8.7 9.8 9.5 16.8a.55.55 0 0 1-.64.6L16.6 20.4Z" fill="#ffffff" />
          <path
            d="M14.4 4.6v18.8M7.8 23.4h14.6"
            stroke="#ffffff"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22.6" cy="9" r="1.2" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
