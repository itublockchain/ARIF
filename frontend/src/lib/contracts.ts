import RequestBookABI from "./contracts/RequestBook.json";

// Contract addresses
export const CONTRACT_ADDRESSES = {
  RequestBook: "0xc70Cfbddb71B7b5478C14384f6D98aa07e86fc18", // Real deployed contract
  ReclaimVerifier: "0x0000000000000000000000000000000000000000",
  AttestationReader: "0x0000000000000000000000000000000000000000",
  TestUSDC: "0x0000000000000000000000000000000000000000",
} as const;

// Contract ABIs
export const CONTRACT_ABIS = {
  RequestBook: RequestBookABI as any[],
  ReclaimVerifier: [] as any[],
  AttestationReader: [] as any[],
  TestUSDC: [] as any[],
} as const;
