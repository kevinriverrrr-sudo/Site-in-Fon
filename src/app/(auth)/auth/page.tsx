import { getDictionary } from "@/lib/i18n";

export default function AuthPage() {
  const dict = getDictionary();
  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>{dict.nav.auth}</h1>
      <p style={{ marginTop: "1rem", color: "#666" }}>{dict.app.description}</p>
    </div>
  );
}
