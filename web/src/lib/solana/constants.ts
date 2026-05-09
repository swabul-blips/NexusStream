import { clusterApiUrl, PublicKey } from "@solana/web3.js";

const DEFAULT_PROGRAM_ID = "nxs1111111111111111111111111111111111111111";

export const NEXUS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID?.trim()?.length ? (process.env.NEXT_PUBLIC_PROGRAM_ID as string) : DEFAULT_PROGRAM_ID,
);

export function getRpcEndpoint(cluster: ClusterChoice): string {
  const custom = process.env.NEXT_PUBLIC_SOLANA_RPC?.trim();
  if (custom) {
    return custom;
  }
  if (cluster === "localnet") {
    return "http://127.0.0.1:8899";
  }
  if (cluster === "mainnet-beta") {
    return clusterApiUrl("mainnet-beta");
  }
  return clusterApiUrl("devnet");
}

export type ClusterChoice = "devnet" | "mainnet-beta" | "localnet";
