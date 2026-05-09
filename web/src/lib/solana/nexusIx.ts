import { sha256 } from "@noble/hashes/sha256";

/**
 * Mirrors Anchor discriminators (`sha256("global:<iname>")[0..8]`).
 */
function discriminator(ixName: string): Buffer {
  const hash = sha256(new TextEncoder().encode(`global:${ixName}`));
  return Buffer.from(hash.slice(0, 8));
}

function u64le(value: bigint | number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function i64le(value: bigint | number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(value));
  return buf;
}

function concat(...parts: Buffer[]): Buffer {
  return Buffer.concat(parts);
}

export function ixDataTipSol(lamports: number): Buffer {
  return concat(discriminator("tip_sol"), u64le(lamports));
}

export function ixDataCreateMarket(marketIndex: number, questionHash32: Uint8Array, cutoffTsSeconds: bigint): Buffer {
  if (questionHash32.byteLength !== 32) {
    throw new Error("questionHash must be 32 bytes");
  }
  return concat(discriminator("create_market"), u64le(marketIndex), Buffer.from(questionHash32), i64le(cutoffTsSeconds));
}

export function ixDataPlaceBet(side: 1 | 2, lamports: number): Buffer {
  return concat(discriminator("place_bet"), Buffer.from([side]), u64le(lamports));
}

export function ixDataResolveMarket(winningSide: 1 | 2): Buffer {
  return concat(discriminator("resolve_market"), Buffer.from([winningSide]));
}

export function ixDataClaimWinnings(): Buffer {
  return discriminator("claim_winnings");
}

export function ixDataGrantMilestone(milestoneId: bigint, labelHash32: Uint8Array): Buffer {
  if (labelHash32.byteLength !== 32) {
    throw new Error("labelHash must be 32 bytes");
  }
  return concat(discriminator("grant_milestone"), u64le(milestoneId), Buffer.from(labelHash32));
}
