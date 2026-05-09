import { sha256 } from "@noble/hashes/sha256";

export function hashLabel(text: string): Uint8Array {
  return sha256(new TextEncoder().encode(text));
}
