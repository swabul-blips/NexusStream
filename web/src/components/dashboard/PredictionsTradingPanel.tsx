"use client";

import GlassPanel from "@/components/ui/GlassPanel";
import { NEXUS_PROGRAM_ID } from "@/lib/solana/constants";
import { backendBaseUrl } from "@/lib/env/api";
import { hashLabel } from "@/lib/solana/hash";
import {
  ixDataClaimWinnings,
  ixDataCreateMarket,
  ixDataPlaceBet,
  ixDataResolveMarket,
} from "@/lib/solana/nexusIx";
import { betPda, marketPda } from "@/lib/solana/pda";
import { sendInstructions } from "@/lib/solana/send";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { useState } from "react";

async function pingPredictionInsight(payload: Record<string, string>) {
  try {
    await fetch(`${backendBaseUrl()}/api/predictions/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // demo-only breadcrumb — ignore downtime
  }
}

export default function PredictionsTradingPanel() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [question, setQuestion] = useState("Will NexusStream eclipse 9000 watchers tonight?");
  const [marketIndex, setMarketIndex] = useState(1);
  const [cutoff, setCutoff] = useState(() => new Date(Date.now() + 1000 * 60 * 30).toISOString().slice(0, 16));
  const [betSol, setBetSol] = useState("0.02");
  const [side, setSide] = useState<1 | 2>(1);
  const [resolveSide, setResolveSide] = useState<1 | 2>(1);
  const [logLine, setLogLine] = useState<string | null>(null);
  /** Seeds the market PDA; paste the streamer pubkey if you are betting into someone else's market */
  const [streamAuthorityPubkey, setStreamAuthorityPubkey] = useState("");

  const signerPubkey = (): PublicKey => {
    if (!wallet.publicKey) {
      throw new Error("Connect Phantom or Solflare to sign prediction transactions.");
    }
    return wallet.publicKey;
  };

  /** Broadcaster pubkey that created the market (used in PDAs); defaults to connected wallet when left blank */
  function marketAuthorityPk(): PublicKey {
    const trimmed = streamAuthorityPubkey.trim();
    if (trimmed.length) {
      try {
        return new PublicKey(trimmed);
      } catch {
        throw new Error("Stream authority pubkey is not valid Solana base58.");
      }
    }
    return signerPubkey();
  }

  async function createMarketIx() {
    const broadcaster = signerPubkey();
    const [marketPk] = marketPda(broadcaster, marketIndex);
    const cutoffSeconds = BigInt(Math.floor(new Date(cutoff).getTime() / 1000));
    const digest = hashLabel(question);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: broadcaster, isSigner: true, isWritable: true },
        { pubkey: marketPk, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: NEXUS_PROGRAM_ID,
      data: ixDataCreateMarket(marketIndex, digest, cutoffSeconds),
    });
    await pingPredictionInsight({
      action: "create_market_preview",
      authority: broadcaster.toBase58(),
    });
    return sendInstructions(connection, wallet, [ix]).then((sig) => `create_market • ${sig}`);
  }

  async function placeStake() {
    const streamer = marketAuthorityPk();
    const [marketPk] = marketPda(streamer, marketIndex);
    const signer = signerPubkey();
    const [betPk] = betPda(marketPk, signer);

    const lamports = Math.max(1, Math.round(Number(betSol) * LAMPORTS_PER_SOL));
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: signer, isSigner: true, isWritable: true },
        { pubkey: marketPk, isSigner: false, isWritable: true },
        { pubkey: betPk, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: NEXUS_PROGRAM_ID,
      data: ixDataPlaceBet(side, lamports),
    });
    await pingPredictionInsight({
      action: "place_bet",
      marketIndex: `${marketIndex}`,
      side: side === 1 ? "YES" : "NO",
    });
    return sendInstructions(connection, wallet, [ix]).then((sig) => `${side === 1 ? "YES" : "NO"} stake • ${sig}`);
  }

  async function settleMarket() {
    const streamer = marketAuthorityPk();
    const signer = signerPubkey();
    if (!signer.equals(streamer)) {
      throw new Error("Switch wallet to the stream authority pubkey before resolving.");
    }
    const [marketPk] = marketPda(streamer, marketIndex);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: signer, isSigner: true, isWritable: true },
        { pubkey: marketPk, isSigner: false, isWritable: true },
      ],
      programId: NEXUS_PROGRAM_ID,
      data: ixDataResolveMarket(resolveSide),
    });
    return sendInstructions(connection, wallet, [ix]).then((sig) => `resolve • ${sig}`);
  }

  async function claimPnL() {
    const streamer = marketAuthorityPk();
    const [marketPk] = marketPda(streamer, marketIndex);
    const signer = signerPubkey();
    const [betPk] = betPda(marketPk, signer);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: signer, isSigner: true, isWritable: true },
        { pubkey: marketPk, isSigner: false, isWritable: true },
        { pubkey: betPk, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: NEXUS_PROGRAM_ID,
      data: ixDataClaimWinnings(),
    });
    return sendInstructions(connection, wallet, [ix]).then((sig) => `claim • ${sig}`);
  }

  return (
    <GlassPanel
      eyebrow="On-chain cockpit"
      title="Wire devnet predictions into the Anchor parimutuel engine"
      footer="Deploy NexusStream with `anchor deploy`, update NEXT_PUBLIC_PROGRAM_ID, and hydrate cluster variables before expecting green paths."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Market authoring</p>
          <label className="block text-[11px] uppercase tracking-[0.3em] text-slate-400">
            Stream authority (market seeds)
            <input
              value={streamAuthorityPubkey}
              onChange={(evt) => setStreamAuthorityPubkey(evt.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-neon-mint outline-none ring-2 ring-transparent focus:ring-neon-cyan"
              placeholder="leave blank if this wallet owns the stream / market PDAs"
            />
          </label>
          <textarea
            value={question}
            onChange={(evt) => setQuestion(evt.target.value)}
            className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/35 p-3 font-mono text-xs text-neon-mint outline-none ring-2 ring-transparent focus:ring-neon-cyan"
          />
          <label className="block text-[11px] uppercase tracking-[0.3em] text-slate-400">
            market index u64
            <input
              type="number"
              min={0}
              value={marketIndex}
              onChange={(evt) => setMarketIndex(Number(evt.target.value))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
            />
          </label>
          <label className="block text-[11px] uppercase tracking-[0.3em] text-slate-400">
            cutoff local time
            <input
              type="datetime-local"
              value={cutoff}
              onChange={(evt) => setCutoff(evt.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
            />
          </label>
          <button
            type="button"
            disabled={wallet.connecting}
            onClick={() =>
              createMarketIx()
                .then(setLogLine)
                .catch((err: Error) => setLogLine(err.message ?? String(err)))
            }
            className="w-full rounded-2xl border border-neon-cyan/60 bg-neon-cyan/10 px-4 py-2 font-mono text-sm text-neon-cyan transition hover:bg-neon-cyan/25"
          >
            Create market (+ rent)
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stake</p>
            <div className="mt-3 flex gap-3">
              {[1, 2].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSide(value as 1 | 2)}
                  className={`rounded-2xl border px-4 py-2 font-mono text-xs ${
                    side === value
                      ? value === 1
                        ? "border-neon-cyan bg-neon-cyan/25 text-black"
                        : "border-neon-fuchsia bg-neon-fuchsia/25 text-white"
                      : "border-white/10 text-slate-300 hover:border-white/30"
                  }`}
                >
                  {value === 1 ? "YES" : "NO"}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0.000001}
              step="0.0001"
              value={betSol}
              onChange={(evt) => setBetSol(evt.target.value)}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 font-mono text-sm text-white"
            />
            <button
              type="button"
              onClick={() => placeStake().then(setLogLine).catch((err: Error) => setLogLine(err.message))}
              className="neon-border mt-3 w-full bg-gradient-to-r from-neon-mint/50 to-neon-cyan/40 px-4 py-2 font-mono text-sm font-semibold text-black"
            >
              Fire bet instruction
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Authority resolve</p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setResolveSide(1)}
                className={`rounded-xl border px-3 py-1 font-mono text-xs ${
                  resolveSide === 1 ? "border-neon-cyan text-neon-cyan" : "border-white/10 text-slate-400"
                }`}
              >
                YES wins
              </button>
              <button
                type="button"
                onClick={() => setResolveSide(2)}
                className={`rounded-xl border px-3 py-1 font-mono text-xs ${
                  resolveSide === 2 ? "border-neon-fuchsia text-neon-fuchsia" : "border-white/10 text-slate-400"
                }`}
              >
                NO wins
              </button>
            </div>
            <button
              type="button"
              onClick={() => settleMarket().then(setLogLine).catch((err: Error) => setLogLine(err.message))}
              className="mt-4 w-full rounded-2xl border border-neon-fuchsia/50 px-4 py-2 font-mono text-xs text-neon-fuchsia"
            >
              resolve_market
            </button>
            <button
              type="button"
              onClick={() => claimPnL().then(setLogLine).catch((err: Error) => setLogLine(err.message))}
              className="mt-3 w-full rounded-2xl border border-white/20 px-4 py-2 font-mono text-xs text-white"
            >
              claim_winnings
            </button>
          </div>
        </div>
      </div>

      {logLine ? (
        <div className="rounded-2xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-neon-mint">{logLine}</div>
      ) : null}
    </GlassPanel>
  );
}
