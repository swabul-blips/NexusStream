"use client";

import { backendBaseUrl } from "@/lib/env/api";
import { useEffect, useMemo, useState } from "react";

type StreamMeta = {
  slug: string;
  title: string;
  broadcaster: string;
  tagline: string;
  peakViewers: number;
  live: boolean;
};

export default function StreamHero() {
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const headline = useMemo(() => meta?.title ?? "Calibrating stream manifest…", [meta]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(`${backendBaseUrl()}/api/stream/genesis-night`);
        if (!res.ok) throw new Error("stream fetch failed");
        const body = (await res.json()) as StreamMeta;
        if (!canceled) setMeta(body);
      } catch {
        if (!canceled) {
          setMeta({
            slug: "offline",
            title: "Local manifest offline",
            broadcaster: "NxStream Sandbox",
            tagline: "Boot the Express server to hydrate metadata.",
            peakViewers: 0,
            live: false,
          });
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden rounded-[32px] border border-neon-stream/15 bg-gradient-to-br from-[#071528] via-neon-deep to-[#12082a] p-10 shadow-[0_30px_120px_rgba(0,0,0,.55)] md:p-12">
      <div className="pointer-events-none absolute inset-0 bg-neon-grid opacity-90" aria-hidden />
      <div className="pointer-events-none absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-neon-violet/35 via-neon-nexus/15 to-transparent blur-3xl" aria-hidden />

      <div className="relative z-10 flex flex-col gap-8 md:flex-row md:justify-between md:gap-14">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex rounded-full border border-neon-stream/35 px-5 py-1 text-[11px] font-mono uppercase tracking-[0.45em] text-neon-stream">
            {meta?.live ? "LIVE CLUSTER" : "STANDBY"}
          </div>
          <div>
            <p className="text-sm font-mono text-neon-cyan">{meta?.broadcaster ?? ""}</p>
            <h2 className="mt-4 font-display text-3xl md:text-[40px] leading-tight text-white">{headline}</h2>
          </div>
          <p className="text-base text-slate-300">{meta?.tagline}</p>
        </div>

        <div className="md:w-[320px]">
          <div className="glass-panel relative border border-white/20 p-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-neon-violet">Signal HUD</p>
            <dl className="mt-6 space-y-4 text-sm text-slate-200">
              <div className="flex justify-between">
                <dt>Peak watchers</dt>
                <dd className="font-mono text-neon-mint">{meta?.peakViewers?.toLocaleString() ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Slug</dt>
                <dd className="font-mono text-xs text-neon-cyan">{meta?.slug ?? "pending"}</dd>
              </div>
              <div className="rounded-2xl border border-neon-violet/25 bg-black/35 p-3 text-[11px] font-mono text-slate-300">
                Telemetry fans out from <span className="text-white">{backendBaseUrl()}</span>. Wire Helius websocket logs for deltas.
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
