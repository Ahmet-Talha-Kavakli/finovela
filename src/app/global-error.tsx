"use client";

// global-error kök layout'u (html/body dahil) yerine geçer; bu yüzden kendi
// <html>/<body> ağacını render eder. globals.css burada yüklü olmayabileceği için
// stiller inline tutuldu (AI Studio siyah dili).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#e6e6e9",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "#6a6a70",
              margin: 0,
            }}
          >
            HATA
          </p>
          <h1
            style={{
              marginTop: 12,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Bir şeyler ters gitti
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#9a9aa0" }}>
            Beklenmeyen bir sorun oluştu. Lütfen tekrar dene.
          </p>
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => reset()}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 10,
                border: "none",
                background: "#8ab4f8",
                color: "#0a0a0a",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Tekrar dene
            </button>
          </div>
          {error?.digest ? (
            <p style={{ marginTop: 24, fontSize: 11, color: "#6a6a70" }}>
              Referans: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
