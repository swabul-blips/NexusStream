"use client";

import { backendBaseUrl } from "@/lib/env/api";
import { useEffect, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";

type PredictionCard = {
  id: string;
  question: string;
  cutoff: string;
  yesOdds: string;
  noOdds: string;
  volumeSol: string;
};

export default function PredictionFeed() {
  const [items, setItems] = useState<PredictionCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const response = await fetch(`${backendBaseUrl()}/api/predictions`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const body = (await response.json()) as PredictionCard[];
        if (!canceled) {
          setItems(body);
        }
      } catch (err) {
        if (!canceled) {
          setError((err as Error).message ?? "prediction feed unreachable");
          setItems([]);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <GlassPanel
      eyebrow="Express telemetry"
      title="Off-chain previews + indexer feeds"
      footer="Hook these payloads into Grape or Helius webhook listeners once your parimutuel markets stream live deltas."
    >
      {error ? (
        <p className="text-sm text-orange-300">Could not hydrate mock odds — {error}. Start `npm run dev` inside /server.</p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {(items ?? Array.from({ length: 2 })).map((item, idx) =>
          items ? (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-neon-cyan">{item.volumeSol} ◎ surfaced</p>
              <p className="mt-3 font-display text-lg text-white">{item.question}</p>
              <div className="mt-6 flex gap-8 text-xs font-mono text-slate-300">
                <span>YES pulse {item.yesOdds}</span>
                <span>NO pulse {item.noOdds}</span>
                <span>Cutoff Δ {item.cutoff}</span>
              </div>
            </div>
          ) : (
            <div key={idx} className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
          ),
        )}
      </div>
    </GlassPanel>
  );
}
