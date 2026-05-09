"use client";

import GlassPanel from "@/components/ui/GlassPanel";
import { NEXUS_PROGRAM_ID } from "@/lib/solana/constants";
import { ixDataTipSol } from "@/lib/solana/nexusIx";
import { sendInstructions } from "@/lib/solana/send";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { useState } from "react";

function parseStreamer(value: string): PublicKey {
  try {
    return new PublicKey(value.trim());
  } catch {
    throw new Error("Paste a valid Solana address for the broadcaster.");
  }
}

function solToLamports(sol: string): number {
  const n = Number(sol);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Use a positive SOL amount.");
  }
  return Math.round(n * LAMPORTS_PER_SOL);
}

export default function TipsPanel() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [streamerInput, setStreamerInput] = useState(
    () => process.env.NEXT_PUBLIC_BROADCASTER_PUBKEY?.trim() ?? "",
  );
  const [amount, setAmount] = useState("0.05");
  const [status, setStatus] = useState<string | null>(null);

  async function sendProtocolTip() {
    setStatus(null);
    if (!wallet.publicKey) throw new Error("Connect Phantom or Solflare first.");
    const streamer = parseStreamer(streamerInput);
    const lamports = solToLamports(amount);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: streamer, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: NEXUS_PROGRAM_ID,
      data: ixDataTipSol(lamports),
    });
    const signature = await sendInstructions(connection, wallet, [ix]);
    setStatus(`tip_sol queued • ${signature}`);
  }

  async function sendInstantTransfer() {
    setStatus(null);
    if (!wallet.publicKey) throw new Error("Connect Phantom or Solflare first.");
    const streamer = parseStreamer(streamerInput);
    const lamports = solToLamports(amount);

    const ix = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: streamer,
      lamports,
    });
    const signature = await sendInstructions(connection, wallet, [ix]);
    setStatus(`instant SOL transfer settled • ${signature}`);
  }

  return (
    <GlassPanel eyebrow="Wallet UX" title="Phantom / Solflare instant tipping rails" footer={`Program id • ${NEXUS_PROGRAM_ID.toBase58()}`}>
      <div className="space-y-5">
        <label className="block text-xs uppercase tracking-[0.3em] text-slate-400">
          Streamer wallet
          <input
            value={streamerInput}
            onChange={(evt) => setStreamerInput(evt.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-neon-mint outline-none ring-2 ring-transparent focus:ring-neon-cyan"
            placeholder="BROADCASTER_ADDRESS"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-slate-400">
          SOL amount
          <input
            value={amount}
            onChange={(evt) => setAmount(evt.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none ring-2 ring-transparent focus:ring-neon-fuchsia"
            inputMode="decimal"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => sendProtocolTip().catch((error: Error) => setStatus(error.message ?? "tip failed"))}
            disabled={wallet.connecting || !wallet.wallet}
            className="neon-border bg-gradient-to-r from-neon-cyan/70 to-emerald-400/60 px-5 py-2 font-mono text-sm font-semibold text-black transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            tip_sol (Anchor)
          </button>
          <button
            type="button"
            onClick={() => sendInstantTransfer().catch((error: Error) => setStatus(error.message ?? "transfer failed"))}
            disabled={wallet.connecting || !wallet.wallet}
            className="rounded-2xl border border-neon-fuchsia/40 px-5 py-2 font-mono text-sm text-neon-fuchsia transition hover:bg-white/5 disabled:opacity-40"
          >
            Native SOL
          </button>
        </div>

        {wallet.publicKey ? (
          <p className="text-xs font-mono text-slate-400">
            Active signer <span className="text-neon-mint">{wallet.publicKey.toBase58()}</span>
          </p>
        ) : (
          <p className="text-xs text-orange-300">Connect a wallet to fan the stream with SOL.</p>
        )}

        {status ? (
          <p className="break-all rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-neon-cyan">{status}</p>
        ) : null}
      </div>
    </GlassPanel>
  );
}
