import type { ClusterChoice } from "@/lib/solana/constants";

export function readClusterFromEnv(): ClusterChoice {
  const raw = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet").trim();
  if (raw === "mainnet-beta" || raw === "devnet" || raw === "localnet") {
    return raw;
  }
  return "devnet";
}
