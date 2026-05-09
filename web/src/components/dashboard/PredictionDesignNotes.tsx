import GlassPanel from "@/components/ui/GlassPanel";

export default function PredictionDesignNotes() {
  return (
    <GlassPanel
      eyebrow="Contract design — parimutuel pool"
      title="Live YES / NO rails with cryptographic question hashes"
      footer="Authority closes claims after cutoff; losers fund winner payout pot inside the immutable market PDA."
    >
      <ul className="space-y-3 text-sm text-slate-200">
        <li>
          <strong className="font-mono text-neon-cyan">create_market</strong> freezes a broadcaster authority, deterministic market index,
          SHA-256 question digest, and i64 cutoff aligned with UNIX slot planning.
        </li>
        <li>
          <strong className="font-mono text-neon-fuchsia">place_bet</strong> moves lamports into the programmable market account, tracks YES/NO
          stakes per wallet, and enforces chronological ordering before cutoff.
        </li>
        <li>
          <strong className="font-mono text-neon-mint">resolve_market</strong> emits a treasury snapshot referencing total lamports excluding
          rent exemptions to keep settlement math honest for winner denominated staking.
        </li>
        <li>
          <strong className="font-mono text-white">claim_winnings</strong> uses program-derived signing over the PDAs to disburse proportional
          SOL back to victorious bettors exactly once via on-chain asserted claims.
        </li>
      </ul>
      <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-neon-mint">
{`Authority PDA derivation
seeds = ["market", authority, u64(market_index)]
Vault = lamports pooled on-market (rent-adjusted snapshots)

Winner_share = snapshot_pool * user_winning_stake / total_winning_stake`}
      </pre>
    </GlassPanel>
  );
}
