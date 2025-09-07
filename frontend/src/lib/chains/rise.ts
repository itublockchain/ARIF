import { defineChain } from "viem";

export const rise = defineChain({
  id: 11155931,
  name: "RISE Testnet",
  network: "rise-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.riselabs.xyz"],
      webSocket: ["wss://testnet.riselabs.xyz/ws"],
    },
    public: {
      http: ["https://testnet.riselabs.xyz"],
      webSocket: ["wss://testnet.riselabs.xyz/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "RISE Explorer",
      url: "https://explorer.testnet.riselabs.xyz",
      apiUrl: "https://explorer.testnet.riselabs.xyz/api",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 1,
    },
  },
  testnet: true,
});
