export type CreditGrade = "A" | "B" | "C";

export type RequestStatus =
  | "Open"
  | "Funded"
  | "Accepted"
  | "Repaid"
  | "Canceled";

export type BorrowRequest = {
  id: bigint;
  borrower: `0x${string}`;
  token: `0x${string}`;
  amount: bigint; // raw (wei/units)
  dueDate: number; // unix seconds
  funded: bigint; // raw
  maxAprBps?: number; // opsiyon
  status: RequestStatus;
};

export type Lending = {
  requestId: bigint;
  lender: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  dueDate: number;
  borrower: `0x${string}`;
};

export interface AttestationData {
  uid: string;
  attester: string;
  timestamp: number;
  isValid: boolean;
  data: string;
}

export interface KYCStatus {
  isVerified: boolean;
  attestation?: AttestationData;
}

export interface CreditScoreStatus {
  grade: CreditGrade;
  hasGrade: boolean;
  attestation?: AttestationData;
}

export interface ReclaimProof {
  proofHash: string;
  timestamp: number;
  isValid: boolean;
  data: string;
}
