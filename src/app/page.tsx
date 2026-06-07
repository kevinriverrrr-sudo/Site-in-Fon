import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Тень в корпусе</h1>
      <p style={{ marginTop: "1rem", color: "#666" }}>
        Готовая 3D horror-игра в одном HTML-файле: двери, корпус, предметы, генератор, ключ, карта, фонарь и NPC-монстр.
      </p>

      <nav style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/horror.html" style={{ color: "#b31625", textDecoration: "underline", fontWeight: 700 }}>
          Играть в 3D Horror
        </Link>
        <Link href="/dashboard" style={{ color: "#0070f3", textDecoration: "underline" }}>
          Панель управления
        </Link>
        <Link href="/auth" style={{ color: "#0070f3", textDecoration: "underline" }}>
          Авторизация
        </Link>
      </nav>
    </main>
  );
}
