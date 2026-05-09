"use client";

import type { ClusterChoice } from "@/lib/solana/constants";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const labels: Record<ClusterChoice, string> = {
  devnet: "Solana • Devnet",
  "mainnet-beta": "Solana • Mainnet-beta",
  localnet: "Solana • Local validator",
};

export default function AppNav({ cluster }: { cluster: ClusterChoice }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 space-y-5">
        <div>
          <h1 className="glass-heading font-display text-3xl md:text-4xl">
            NexusStream <span className="font-mono text-sm text-neon-mint">MVP</span>
          </h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Instant SOL tips, live parimutuel predictions, milestone proofs, and a Neon glass control surface.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-full border border-neon-stream/25 bg-neon-stream/5 px-4 py-1 text-[10px] font-mono uppercase tracking-[0.35em] text-neon-stream">
            Web3 streaming on Solana
          </p>
          <p className="rounded-full border border-neon-violet/25 bg-neon-violet/10 px-4 py-1 text-[10px] font-mono uppercase tracking-[0.35em] text-neon-violet">
            {labels[cluster]}
          </p>
          <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            MVP toolkit
          </span>
        </div>
      </div>
      <div className="nav-wallet-slot flex shrink-0 flex-wrap items-center gap-3 rounded-2xl border border-neon-nexus/20 bg-gradient-to-br from-neon-deep/90 to-black/40 px-4 py-3 shadow-[inset_0_1px_0_rgba(53,240,255,0.08)] backdrop-blur-xl lg:self-center">
        <WalletMultiButton />
      </div>
    </header>
  );
}
