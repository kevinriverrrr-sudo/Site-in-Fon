"use client";

import { useCallback, useRef, useState } from "react";
import { getDictionary } from "@/lib/i18n";

interface Props {
  disabled?: boolean;
  onJobCreated?: (id: string) => void;
}

export function Uploader({ disabled, onJobCreated }: Props) {
  const dict = getDictionary();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || loading) return;
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await upload(file);
  }, [disabled, loading]);

  async function upload(file: File) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/jobs", { method: "POST", body: form });
      if (!res.ok) {
        if (res.status === 429) throw new Error("limit");
        if (res.status === 400) throw new Error("bad");
        throw new Error("upload");
      }
      const data = await res.json();
      onJobCreated?.(data.id);
    } catch (e: any) {
      if (e.message === "limit") setError(dict.errors.quotaExceeded);
      else if (e.message === "bad") setError(dict.errors.unsupportedType);
      else setError(dict.errors.uploadFailed);
    } finally {
      setLoading(false);
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={openPicker}
        style={{
          border: `2px dashed ${dragOver ? "#0070f3" : "#999"}`,
          borderRadius: 12,
          padding: "2rem",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          background: dragOver ? "#f0f7ff" : "#fafafa",
          color: "#444",
        }}
      >
        {disabled ? (
          <div>{dict.dashboard.limitReached}</div>
        ) : loading ? (
          <div>{dict.dashboard.uploading}</div>
        ) : (
          <div>
            <div>{dict.dashboard.instructions}</div>
            <div style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
              {dict.dashboard.formatsHint}
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await upload(file);
            e.currentTarget.value = "";
          }}
          disabled={disabled || loading}
        />
      </div>
      {error && <p style={{ color: "#c00", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
