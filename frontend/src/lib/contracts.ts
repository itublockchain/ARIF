import RequestBookABI from "./contracts/RequestBook.json";

// Contract addresses
export const CONTRACT_ADDRESSES = {
  RequestBook: "0xc70Cfbddb71B7b5478C14384f6D98aa07e86fc18", // Real deployed contract
  ReclaimVerifier: "0x0000000000000000000000000000000000000000",
  AttestationReader: "0x0000000000000000000000000000000000000000",
  TestUSDC: "0x1234567890abcdef1234567890abcdef12345678", // Mock USDC address - should be real USDC address on RISE testnet
} as const;

// ERC20 ABI for USDC
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Contract ABIs
export const CONTRACT_ABIS = {
  RequestBook: RequestBookABI as unknown[],
  ReclaimVerifier: [] as unknown[],
  AttestationReader: [] as unknown[],
  TestUSDC: ERC20_ABI,
} as const;
