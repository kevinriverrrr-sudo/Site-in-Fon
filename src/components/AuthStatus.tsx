"use client";

import { useState } from "react";

type Props = { user?: { id?: string; name?: string | null } };

export function AuthStatus({ user }: Props) {
  const [name, setName] = useState("");

  if (user?.id) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span>Вы вошли как <strong>{user.name || "Пользователь"}</strong></span>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.reload();
          }}
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}
      />
      <button
        type="button"
        onClick={async () => {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name || "Demo" }),
          });
          if (res.ok) window.location.reload();
        }}
      >
        Войти
      </button>
    </div>
  );
}
