"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
// Removed unused chain imports
import { rise } from "@/lib/chains/rise";
import { ReactNode, useState } from "react";
import { http } from "wagmi";

// Use a valid WalletConnect project ID format
const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
  "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

const config = getDefaultConfig({
  appName: "ARIF P2P Credit",
  projectId,
  chains: [rise], // Sadece RISE chain'ini kullan
  transports: {
    [rise.id]: http(
      process.env.NEXT_PUBLIC_RISE_RPC || "https://testnet.riselabs.xyz"
    ),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
