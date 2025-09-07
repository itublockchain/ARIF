import { createPublicClient, createWalletClient, http } from "viem";
import { rise } from "./chains/rise";

// Public client for read operations
export const publicClient = createPublicClient({
  chain: rise,
  transport: http(
    process.env.NEXT_PUBLIC_RISE_RPC || "https://testnet.riselabs.xyz"
  ),
});

// Wallet client for write operations
export const walletClient = createWalletClient({
  chain: rise,
  transport: http(
    process.env.NEXT_PUBLIC_RISE_RPC || "https://testnet.riselabs.xyz"
  ),
});
