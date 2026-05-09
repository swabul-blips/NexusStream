import GlassPanel from "@/components/ui/GlassPanel";

const milestones = [
  {
    id: "m1",
    label: "First Stream Sync",
    copy: "On-chain acknowledgement that wallets locked to the broadcaster feed.",
    tier: "Prism I",
    accent: "from-neon-cyan/60 via-transparent to-transparent",
  },
  {
    id: "m2",
    label: "Signal Surge — 250 tips",
    copy: "Milestone proofs can later graduate into Metaplex Core mints tied to SPL-22 traits.",
    tier: "Prism III",
    accent: "from-neon-fuchsia/60 via-transparent to-transparent",
  },
  {
    id: "m3",
    label: "Vault Oracle Resolved",
    copy: `Streams that resolve prediction PDAs inherit verifiable reputations anchored to \`grant_milestone\` calls.`,
    tier: "Prism Ω",
    accent: "from-neon-mint/60 via-transparent to-transparent",
  },
];

export default function MilestoneShelf() {
  return (
    <GlassPanel eyebrow="Milestone rewards (NFT roadmap)" title="Neon collectible shelf — proofs now, mints soon">
      <div className="grid gap-4 md:grid-cols-3">
        {milestones.map((card) => (
          <figure
            key={card.id}
            className="relative rounded-3xl border border-white/15 bg-black/35 p-4 shadow-inner shadow-black/40"
          >
            <span
              className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${card.accent} opacity-55`}
              aria-hidden
            />
            <figcaption className="relative space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-neon-fuchsia">{card.tier}</p>
              <h3 className="font-display text-lg font-semibold text-white">{card.label}</h3>
              <p className="text-xs leading-relaxed text-slate-300">{card.copy}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        The Anchor ledger records deterministic PDAs seeded by broadcaster + viewer + milestone id — drop in compressed NFTs via Metaplex
        CPI when you graduate past the prototype rails.
      </p>
    </GlassPanel>
  );
}
