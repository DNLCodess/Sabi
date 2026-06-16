import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, HeartHandshake, CheckCircle2 } from "lucide-react";
import AyoAvatar from "@/components/AyoAvatar";
import QRSection from "./QRSection";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "clamp(40px, 8vw, 80px) 24px 0",
        }}
      >
        {/* Logo */}
        {/* Ayo avatar */}
        <div style={{ marginBottom: 28 }}>
          <AyoAvatar size={88} glow />
        </div>
        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 6vw + 1rem, 4rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
            maxWidth: 520,
          }}
        >
          <span
            style={{
              background: "var(--grad-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            You no need explain.
          </span>
          <br />
          <span style={{ color: "var(--text-primary)" }}>We sabi.</span>
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--text-secondary)",
            margin: "0 0 28px",
            fontFamily: "var(--font-body)",
          }}
        >
          AI care. Human understanding.
        </p>
        {/* Privacy chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 18px",
            borderRadius: "var(--r-full)",
            background: "var(--primary-subtle)",
            border: "1px solid var(--lavender)",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--primary)",
            marginBottom: 40,
            fontFamily: "var(--font-body)",
          }}
        >
          <ShieldCheck size={14} strokeWidth={2.5} />
          Anonymous · No name · Nothing saved
        </div>
        {/* Trust strip */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px 28px",
            marginBottom: 48,
          }}
        >
          {[
            { Icon: ShieldCheck, text: "Anonymous" },
            { Icon: HeartHandshake, text: "Routes to real help" },
            { Icon: CheckCircle2, text: "Validated tools" },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              <Icon size={16} strokeWidth={1.75} color="var(--primary)" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── QR section ───────────────────────────────────────────── */}
      <QRSection />

      {/* ── Sticky CTA bar (single source of truth for both mobile + desktop) ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 20px 24px",
          background: "rgba(250,251,255,0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid var(--border)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Link
            href="/check-in?mode=self"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 52,
              background: "var(--grad-aurora)",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "var(--r-full)",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(124,111,255,0.25)",
            }}
          >
            Start a check-in
          </Link>
          <Link
            href="/check-in?mode=friend"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 48,
              background: "transparent",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              fontWeight: 500,
              borderRadius: "var(--r-full)",
              border: "1.5px solid var(--border)",
              textDecoration: "none",
            }}
          >
            Worried about a friend?
          </Link>
        </div>
      </div>
    </main>
  );
}
