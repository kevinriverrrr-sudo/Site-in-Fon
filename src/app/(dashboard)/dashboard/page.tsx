import { getCurrentUser } from "@/lib/auth";
import { ImageUploader } from "@/components/ImageUploader";
import { AuthStatus } from "@/components/AuthStatus";

export default function DashboardPage() {
  const user = getCurrentUser();
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Панель управления</h1>
      <p style={{ marginTop: "1rem", color: "#666" }}>
        Это страница панели управления приложения.
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <AuthStatus user={user ?? undefined} />
      </div>

      <div style={{ marginTop: "1.5rem", maxWidth: 640 }}>
        <h2>Загрузка изображения</h2>
        <p style={{ marginTop: 4, color: "#666", fontSize: 14 }}>
          Поддерживаются JPG, PNG, WebP до 15MB. Файлы загружаются напрямую в приватное хранилище.
        </p>
        <div style={{ marginTop: 12 }}>
          <ImageUploader userId={user?.id} />
        </div>
      </div>
    </div>
  );
}
