"use client";

import { useCallback, useRef, useState } from "react";

const MAX_MB = 15;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({ userId }: { userId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const handleFile = (f: File) => {
    setError(null);
    setDone(false);
    setProgress(0);
    if (!ACCEPTED.includes(f.type)) {
      setError("Неподдерживаемый тип файла. Допустимы JPG, PNG, WebP.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Файл слишком большой (макс. ${MAX_MB}MB).`);
      return;
    }
    setFile(f);
  };

  const startUpload = async () => {
    if (!file) return;
    setError(null);
    setProgress(5);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось получить ссылку загрузки");
      }
      const { uploadUrl, key } = await presignRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(Math.max(10, Math.min(95, pct)));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Ошибка загрузки: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Ошибка сети при загрузке"));
        xhr.send(file);
      });

      setProgress(98);

      const completeRes = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, size: file.size, mime: file.type }),
      });
      if (!completeRes.ok) {
        const data = await completeRes.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось сохранить запись о загрузке");
      }

      setProgress(100);
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Произошла ошибка при загрузке");
      setProgress(0);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={onDrop}
        style={{
          border: "2px dashed #bbb",
          padding: "1.5rem",
          borderRadius: 8,
          textAlign: "center",
          background: "#fafafa",
        }}
      >
        <p style={{ margin: 0 }}>Перетащите изображение сюда или выберите файл</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ marginTop: "0.5rem" }}
          disabled={!userId}
        >
          Выбрать файл
        </button>
        {!userId && (
          <p style={{ color: "#a00", marginTop: "0.5rem" }}>Требуется авторизация</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          style={{ display: "none" }}
        />
      </div>

      {file && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
              </div>
            </div>
            <button type="button" onClick={startUpload} disabled={!userId || progress > 0 && progress < 100}>
              Загрузить
            </button>
          </div>

          {progress > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 8, background: "#eee", borderRadius: 4 }}>
                <div style={{ width: `${progress}%`, height: 8, background: done ? "#0a0" : "#09f", borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: done ? "#0a0" : "#666", marginTop: 4 }}>
                {done ? "Готово" : `Загрузка: ${progress}%`}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: "#a00", marginTop: "0.75rem" }}>{error}</div>
      )}
    </div>
  );
}
