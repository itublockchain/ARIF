// Contract addresses and ABIs will be populated after deployment
export const CONTRACT_ADDRESSES = {
  RequestBook: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
  ReclaimVerifier: "0x0000000000000000000000000000000000000000",
  AttestationReader: "0x0000000000000000000000000000000000000000",
  TestUSDC: "0x0000000000000000000000000000000000000000",
} as const;

// Contract ABIs will be imported from generated typechain types
export const CONTRACT_ABIS = {
  RequestBook: [] as any[], // Will be populated from typechain
  ReclaimVerifier: [] as any[],
  AttestationReader: [] as any[],
  TestUSDC: [] as any[],
} as const;
