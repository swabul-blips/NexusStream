NexusStream MVP — monorepo layout
=================================

Stacks
------
- web/ — Next.js 14.2 App Router, TypeScript, Tailwind (Phantom + Solflare via wallet-adapter)
- server/ — Express + TypeScript API (telemetry + mock predictions)
- programs/nexus-stream — Anchor 0.30 program (SOL tips + parimutuel predictions + milestone ledger PDAs)

Prerequisites
-------------
Install Node.js 20+, Solana CLI, Anchor 0.30.x matching the program (Rust toolchain stable).

Development
-----------
From repo root (recommended):
   npm install
   npm run dev:server    # terminal 1
   npm run dev:web       # terminal 2

Or install per package:

1. API
   cd server
   npm install
   npm run build && npm run dev

2. Web
   cd web
   npm install
   cp .env.example .env.local (optional)
   npm run dev
   Open http://localhost:3000

3. Program
   anchor build
   anchor deploy (localnet or devnet)
   Align declare_id!/Anchor.toml/program keypair — use `anchor keys list` after first build if needed.

Environment (web/.env.local)
----------------------------
See web/.env.example for NEXT_PUBLIC_SOLANA_CLUSTER, NEXT_PUBLIC_PROGRAM_ID, RPC, NEXT_PUBLIC_API_URL.

Favicon
-------
Tab icon: web/src/app/icon.png (Next.js app icon convention).

Notes
-----
- Native SOL transfer always works once a wallet funds devnet SOL; Anchor program tips/predictions need the deployed program id.
- Prediction UI builds raw Anchor instruction data aligned with instructions in programs/nexus-stream/src/lib.rs.
