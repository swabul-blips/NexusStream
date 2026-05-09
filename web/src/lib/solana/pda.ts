import { PublicKey } from "@solana/web3.js";
import { NEXUS_PROGRAM_ID } from "./constants";

export function u64Seed(n: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(n));
  return buf;
}

export function marketPda(authority: PublicKey, marketIndex: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), authority.toBuffer(), u64Seed(marketIndex)],
    NEXUS_PROGRAM_ID,
  );
}

export function betPda(market: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("bet"), market.toBuffer(), user.toBuffer()], NEXUS_PROGRAM_ID);
}

export function milestonePda(streamer: PublicKey, viewer: PublicKey, milestoneId: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("milestone"), streamer.toBuffer(), viewer.toBuffer(), u64Seed(milestoneId)],
    NEXUS_PROGRAM_ID,
  );
}
