"use client";

import { useEffect, useState } from "react";
import { Uploader } from "@/components/Uploader";
import { JobProgress } from "@/components/JobProgress";
import { getDictionary } from "@/lib/i18n";
import Link from "next/link";

export function DashboardClient() {
  const dict = getDictionary();
  const [remaining, setRemaining] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [jobId, setJobId] = useState<string | null>(null);

  async function refreshQuota() {
    const res = await fetch("/api/quota", { cache: "no-store" });
    if (res.ok) {
      const q = await res.json();
      setRemaining(q.remaining);
      setLimit(q.limit);
    }
  }

  useEffect(() => {
    // ensure session
    fetch("/api/auth/ensure");
    refreshQuota();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{dict.dashboard.title}</h1>
      <p style={{ marginTop: 8, color: "#666" }}>{dict.dashboard.remaining(remaining, limit)}</p>

      <div style={{ marginTop: "1rem" }}>
        <Uploader
          disabled={remaining <= 0}
          onJobCreated={(id) => {
            setJobId(id);
            refreshQuota();
          }}
        />
      </div>

      {jobId && (
        <div style={{ marginTop: "1rem" }}>
          <JobProgress jobId={jobId} />
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <Link href="/history" style={{ color: "#0070f3", textDecoration: "underline" }}>
          {dict.history.title}
        </Link>
      </div>
    </div>
  );
}
