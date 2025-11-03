"use client";

import { getDictionary } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export function LandingHero() {
  const dict = getDictionary();
  const router = useRouter();

  async function onClick() {
    try {
      await fetch("/api/auth/ensure", { cache: "no-store" });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  return (
    <section style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700 }}>{dict.landing.heroTitle}</h1>
      <p style={{ marginTop: "1rem", color: "#555", fontSize: "1.1rem" }}>
        {dict.landing.heroSubtitle}
      </p>
      <button
        onClick={onClick}
        style={{
          marginTop: "2rem",
          padding: "0.75rem 1.5rem",
          background: "#0070f3",
          color: "#fff",
          border: 0,
          borderRadius: 8,
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        {dict.landing.cta}
      </button>

      <div style={{ maxWidth: 900, margin: "3rem auto 0", textAlign: "left" }}>
        <h2 style={{ fontSize: "1.5rem" }}>{dict.landing.featuresTitle}</h2>
        <ul style={{ marginTop: "1rem", color: "#444", lineHeight: 1.8 }}>
          {dict.landing.features.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
