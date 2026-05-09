import type { WalletContextState } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, Connection, Transaction, TransactionInstruction } from "@solana/web3.js";

export async function sendInstructions(
  connection: Connection,
  wallet: WalletContextState,
  instructions: TransactionInstruction[],
): Promise<string> {
  const { publicKey, signTransaction } = wallet;
  if (!publicKey) {
    throw new Error("Connect a wallet before sending transactions.");
  }
  if (!signTransaction) {
    throw new Error("Wallet cannot sign transactions.");
  }

  const blockhashCtx = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({
    feePayer: publicKey,
    recentBlockhash: blockhashCtx.blockhash,
  });

  tx.add(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 6_500 }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    ...instructions,
  );

  const signed = await signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(
    {
      signature: sig,
      blockhash: blockhashCtx.blockhash,
      lastValidBlockHeight: blockhashCtx.lastValidBlockHeight,
    },
    "confirmed",
  );

  return sig;
}
