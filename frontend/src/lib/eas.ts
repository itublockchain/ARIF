// Mock EAS Implementation
// EAS Configuration
const EAS_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_EAS_ADDRESS ||
  "0x4200000000000000000000000000000000000021";
const EAS_SCHEMA_UID_KYC_PASSED =
  process.env.NEXT_PUBLIC_EAS_SCHEMA_KYC ||
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const EAS_SCHEMA_UID_CREDIT_GRADE =
  process.env.NEXT_PUBLIC_EAS_SCHEMA_GRADE ||
  "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

// Mock EAS Instance
class MockEAS {
  constructor(contractAddress: string) {
    console.log("Mock EAS initialized with contract:", contractAddress);
  }

  async attest(schema: string, data: Record<string, unknown>) {
    console.log("Mock EAS attest called with:", { schema, data });
    // Return a mock transaction hash
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    console.log("Mock attestation created with tx hash:", mockTxHash);
    return mockTxHash;
  }

  async getAttestation(uid: string) {
    console.log("Mock EAS getAttestation called for:", uid);
    // Return mock attestation data
    return {
      uid,
      valid: true,
      data: "mock-attestation-data",
    };
  }
}

// Initialize EAS
export async function getEASInstance() {
  return new MockEAS(EAS_CONTRACT_ADDRESS);
}

// Initialize Offchain EAS
export async function getOffchainEASInstance() {
  return {
    address: EAS_CONTRACT_ADDRESS,
    chainId: 11155931, // RISE L2
    version: "0.26",
  };
}

// KYC Attestation Schema
export const KYC_SCHEMA = "bool kycPassed,string inquiryId,uint256 timestamp";

// Credit Grade Attestation Schema
export const CREDIT_GRADE_SCHEMA =
  "string grade,uint256 score,uint256 timestamp";

// Create KYC Passed Attestation
export async function createKYCAttestation(
  provider: unknown,
  signer: unknown,
  inquiryId: string,
  walletAddress: string
) {
  try {
    const eas = await getEASInstance();

    const tx = await eas.attest(EAS_SCHEMA_UID_KYC_PASSED, {
      recipient: walletAddress,
      inquiryId: inquiryId,
      timestamp: Math.floor(Date.now() / 1000),
    });

    console.log("KYC Attestation created:", tx);

    return tx;
  } catch (error) {
    console.error("Error creating KYC attestation:", error);
    throw error;
  }
}

// Create Credit Grade Attestation
export async function createCreditGradeAttestation(
  provider: unknown,
  signer: unknown,
  grade: "A" | "B" | "C",
  score: number,
  walletAddress: string
) {
  try {
    const eas = await getEASInstance();

    const tx = await eas.attest(EAS_SCHEMA_UID_CREDIT_GRADE, {
      recipient: walletAddress,
      grade: grade,
      score: score,
      timestamp: Math.floor(Date.now() / 1000),
    });

    console.log("Credit Grade Attestation created:", tx);

    return tx;
  } catch (error) {
    console.error("Error creating credit grade attestation:", error);
    throw error;
  }
}

// Verify KYC Attestation
export async function verifyKYCAttestation(
  provider: unknown,
  attestationUID: string
): Promise<boolean> {
  try {
    const eas = await getEASInstance();
    const attestation = await eas.getAttestation(attestationUID);

    return attestation !== null;
  } catch (error) {
    console.error("Error verifying KYC attestation:", error);
    return false;
  }
}

// Get KYC Attestations for a wallet
export async function getKYCAttestations(
  provider: unknown,
  walletAddress?: string
) {
  try {
    // Mock implementation - return empty array
    console.log("Getting KYC attestations for wallet:", walletAddress);
    return [];
  } catch (error) {
    console.error("Error getting KYC attestations:", error);
    return [];
  }
}
