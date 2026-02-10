import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "ui-sans-serif, system-ui", padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>AISPORE</h1>
      <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 28 }}>
        A community-driven participation system.<br />
        <b>Holding = Participation.</b>
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22 }}>What is this?</h2>
        <p style={{ lineHeight: 1.6 }}>
          AISPORE is not staking. It is not yield. It is not a promise of returns.
          Participation is earned through holding and activity, and outcomes are decided
          through a transparent, verifiable weekly process.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22 }}>How it works</h2>
        <ol style={{ lineHeight: 1.8 }}>
          <li>Participants earn tickets based on defined participation rules.</li>
          <li>A weekly draw is run deterministically.</li>
          <li>The result is locked by admin and published publicly.</li>
          <li>Anyone can verify the outcome from public data.</li>
        </ol>
      </section>

      <section style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/draw" style={btnStyle}>View weekly draw</Link>
        <Link href="/chest" style={btnStyle}>Open chest (read-only)</Link>
      </section>

      <footer style={{ marginTop: 48, opacity: 0.6 }}>
        Web is the source of truth. Telegram announces only.
      </footer>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid #ddd",
  textDecoration: "none",
  color: "#111",
  fontWeight: 600
};
