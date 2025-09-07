"use client";

import { WagmiProvider, createConfig } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { rise } from "@/lib/chains/rise";
import { ReactNode, useState } from "react";
import { http } from "wagmi";

// Create config without WalletConnect to avoid API errors
const config = createConfig({
  chains: [rise],
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
