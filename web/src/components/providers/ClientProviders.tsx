"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import type { ClusterChoice } from "@/lib/solana/constants";
import { getRpcEndpoint } from "@/lib/solana/constants";
import { ReactNode, useMemo } from "react";

function walletNetworkForCluster(cluster: ClusterChoice): WalletAdapterNetwork {
  switch (cluster) {
    case "mainnet-beta":
      return WalletAdapterNetwork.Mainnet;
    case "devnet":
    case "localnet":
    default:
      return WalletAdapterNetwork.Devnet;
  }
}

export default function ClientProviders({
  cluster,
  children,
}: {
  cluster: ClusterChoice;
  children: ReactNode;
}) {
  const endpoint = useMemo(() => getRpcEndpoint(cluster), [cluster]);

  const wallets = useMemo(() => {
    const network = walletNetworkForCluster(cluster);
    return [new PhantomWalletAdapter({ network }), new SolflareWalletAdapter({ network })];
  }, [cluster]);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
