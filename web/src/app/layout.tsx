import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";
import type { ClusterChoice } from "@/lib/solana/constants";
import { readClusterFromEnv } from "@/lib/env/cluster";
import { Space_Grotesk, Syne } from "next/font/google";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "NexusStream • Web3 streaming toolkit",
  description: "SOL tips, Anchor predictions, milestone rewards, Neon glass dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cluster = readClusterFromEnv() satisfies ClusterChoice;

  return (
    <html lang="en" className={`${syne.variable} ${grotesk.variable}`}>
      <body className="min-h-screen bg-neon-deep antialiased text-slate-100">
        <ClientProviders cluster={cluster}>
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-neon-grid">
            <div className="absolute inset-x-[-25%] top-[-15%] h-[620px] animate-drift rounded-full bg-[radial-gradient(circle,_rgba(106,92,255,0.12),transparent_55%)]" />
            <div className="absolute inset-x-[-15%] top-[-8%] h-[480px] animate-drift rounded-full bg-[radial-gradient(circle,_rgba(53,240,255,0.1),transparent_58%)] opacity-90 [animation-delay:-8s]" />
          </div>
          <main>{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}
