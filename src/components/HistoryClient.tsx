"use client";

import { useEffect, useState } from "react";
import { getDictionary } from "@/lib/i18n";

interface JobItem {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  originalName: string;
  size: number;
}

export function HistoryClient() {
  const dict = getDictionary();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/jobs", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/ensure");
    load();
  }, []);

  async function download(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}/sign`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    window.open(data.url, "_blank");
  }

  async function remove(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{dict.history.title}</h1>
      {loading ? (
        <p style={{ marginTop: 8, color: "#666" }}>{dict.common.loading}</p>
      ) : jobs.length === 0 ? (
        <p style={{ marginTop: 8, color: "#666" }}>{dict.history.empty}</p>
      ) : (
        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {jobs.map((j) => (
            <div key={j.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, background: "#fff" }}>
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", borderRadius: 6 }}>
                <img src={`/api/jobs/${j.id}/file`} alt={j.originalName} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 6 }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>{new Date(j.createdAt).toLocaleString("ru-RU")}</div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>{j.originalName}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  onClick={() => download(j.id)}
                  disabled={j.status !== "completed"}
                  style={{ padding: "0.4rem 0.6rem", background: "#10b981", color: "#fff", border: 0, borderRadius: 6, cursor: j.status !== "completed" ? "not-allowed" : "pointer" }}
                >
                  {dict.dashboard.download}
                </button>
                <button
                  onClick={() => remove(j.id)}
                  style={{ padding: "0.4rem 0.6rem", background: "#ef4444", color: "#fff", border: 0, borderRadius: 6 }}
                >
                  {dict.dashboard.delete}
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
                {j.status === "queued"
                  ? dict.status.queued
                  : j.status === "processing"
                  ? dict.status.processing
                  : j.status === "completed"
                  ? dict.status.completed
                  : dict.status.failed}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
