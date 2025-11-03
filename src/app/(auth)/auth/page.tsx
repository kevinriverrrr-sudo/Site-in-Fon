import { getCurrentUser } from "@/lib/auth";
import { AuthStatus } from "@/components/AuthStatus";

export default function AuthPage() {
  const user = getCurrentUser();
  return (
    <div style={{ padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
      <h1>Авторизация</h1>
      <p style={{ marginTop: "1rem", color: "#666" }}>
        Войдите, чтобы загружать файлы в хранилище.
      </p>
      <div style={{ marginTop: "1rem" }}>
        <AuthStatus user={user ?? undefined} />
      </div>
    </div>
  );
}
