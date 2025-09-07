export type CreditGrade = "A" | "B" | "C";

export type RequestStatus =
  | "Open"
  | "Funded"
  | "Accepted"
  | "Repaid"
  | "Canceled";

// Real contract BorrowRequest structure
export type BorrowRequest = {
  id: bigint;
  borrower: `0x${string}`;
  amount: bigint; // raw (wei/units)
  deadline: bigint; // unix timestamp
  overtime_interest: bigint; // basis points (e.g., 1000 = 10%)
  assetERC20Address: `0x${string}`;
};

// Real contract Loan structure
export type Loan = {
  isFilled: boolean;
  borrowID: bigint;
  lender: `0x${string}`;
};

// Extended BorrowRequest with additional frontend data
export type BorrowRequestExtended = BorrowRequest & {
  dueDate?: number; // unix seconds (for frontend display)
  funded?: bigint; // raw (for frontend display)
  maxAprBps?: number; // opsiyon (for frontend display)
  status: RequestStatus; // computed status
  isOverdue?: boolean; // computed from deadline
  currentInterestRate?: number; // computed based on overdue days
};

// Legacy Lending type for compatibility
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
