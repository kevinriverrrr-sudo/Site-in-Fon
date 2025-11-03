import Link from "next/link";
import { ExampleComponent } from "@/components/ExampleComponent";
import { env } from "@/env";

export default function HomePage() {
  // Validate env on page load
  console.log("Environment validated successfully");

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Добро пожаловать в Next.js 14</h1>
      <p style={{ marginTop: "1rem", color: "#666" }}>
        Это стартовая страница приложения с App Router и TypeScript.
      </p>
      
      <div style={{ marginTop: "2rem" }}>
        <ExampleComponent />
      </div>

      <nav style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
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
