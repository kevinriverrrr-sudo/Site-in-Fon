"use client";

import { useEffect, useState } from "react";
import { getDictionary } from "@/lib/i18n";

interface Props {
  jobId: string;
}

export function JobProgress({ jobId }: Props) {
  const dict = getDictionary();
  const [status, setStatus] = useState<"queued" | "processing" | "completed" | "failed">("queued");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        if (data.status === "completed") {
          setReady(true);
          const signRes = await fetch(`/api/jobs/${jobId}/sign`, { cache: "no-store" });
          if (signRes.ok) {
            const s = await signRes.json();
            setDownloadUrl(s.url);
            return; // stop polling
          }
        }
      } catch {}
      if (!stopped && status !== "completed" && status !== "failed") {
        setTimeout(poll, 800);
      }
    }

    poll();

    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const label =
    status === "queued"
      ? dict.status.queued
      : status === "processing"
      ? dict.status.processing
      : status === "completed"
      ? dict.status.completed
      : dict.status.failed;

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ color: "#555" }}>{label}</div>
      {ready && (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <img src={`/api/jobs/${jobId}/result`} alt={dict.dashboard.resultReady} style={{ maxWidth: 360, borderRadius: 8, border: "1px solid #eee" }} />
          </div>
          {downloadUrl && (
            <a
              href={downloadUrl}
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "0.5rem 1rem",
                background: "#10b981",
                color: "#fff",
                borderRadius: 8,
              }}
            >
              {dict.dashboard.download}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
