import { BorrowRequestExtended, Lending } from "./types";
 
// Mock contract service - will be replaced with real contract calls
class MockContractService {
  private requests: Map<bigint, BorrowRequestExtended> = new Map();
  private lendings: Map<string, Lending> = new Map();
  private nextRequestId = 1n;

  // Create a new borrow request
  async createRequest(
    borrower: `0x${string}`,
    assetERC20Address: `0x${string}`,
    amount: bigint,
    dueDate: number,
    overtimeInterestBps: number
  ): Promise<bigint> {
    const requestId = this.nextRequestId++;

    const request: BorrowRequestExtended = {
      id: requestId,
      borrower,
      assetERC20Address,
      amount,
      deadline: BigInt(dueDate),
      overtime_interest: BigInt(overtimeInterestBps),
      dueDate,
      funded: 0n,
      maxAprBps: overtimeInterestBps / 100, // Convert basis points to percentage
      isFunded: false,
      isOverdue: false,
      currentInterestRate: overtimeInterestBps,
    };

    this.requests.set(requestId, request);

    // Simulate blockchain delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return requestId;
  }

  // Fund a request (lender provides funds)
  async fundRequest(
    requestId: bigint,
    lender: `0x${string}`,
    amount: bigint
  ): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.isFunded) {
      throw new Error("Request is already funded");
    }

    const remainingAmount = request.amount - (request.funded || 0n);
    if (amount > remainingAmount) {
      throw new Error("Amount exceeds remaining funding needed");
    }

    // Update request funding
    request.funded = (request.funded || 0n) + amount;

    // If fully funded, change status
    if (request.funded >= request.amount) {
      request.isFunded = true;
    }

    // Create lending record
    const lendingId = `${requestId}-${lender}`;
    const lending: Lending = {
      requestId,
      lender,
      token: request.assetERC20Address,
      amount,
      dueDate: request.dueDate || 0,
      borrower: request.borrower,
    };

    this.lendings.set(lendingId, lending);

    // Simulate blockchain delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  }

  // Accept a funded request (borrower accepts the loan)
  async acceptRequest(
    requestId: bigint,
    borrower: `0x${string}`
  ): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.borrower !== borrower) {
      throw new Error("Only the borrower can accept the request");
    }

    if (!request.isFunded) {
      throw new Error("Request is not fully funded");
    }

    // Request is accepted (no status change needed, just isFunded remains true)

    // Simulate blockchain delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  }

  // Repay a loan
  async repayRequest(
    requestId: bigint,
    borrower: `0x${string}`
  ): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.borrower !== borrower) {
      throw new Error("Only the borrower can repay the request");
    }

    if (!request.isFunded) {
      throw new Error("Request is not funded");
    }

    // Request is repaid (no status change needed, just isFunded remains true)

    // Simulate blockchain delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  }

  // Get all open requests
  async getAllRequests(): Promise<BorrowRequestExtended[]> {
    return Array.from(this.requests.values());
  }

  // Get requests by borrower
  async getRequestsByBorrower(
    borrower: `0x${string}`
  ): Promise<BorrowRequestExtended[]> {
    return Array.from(this.requests.values()).filter(
      (request) => request.borrower === borrower
    );
  }

  // Get lendings by lender
  async getLendingsByLender(lender: `0x${string}`): Promise<Lending[]> {
    return Array.from(this.lendings.values()).filter(
      (lending) => lending.lender === lender
    );
  }

  // Get request by ID
  async getRequestById(
    requestId: bigint
  ): Promise<BorrowRequestExtended | null> {
    return this.requests.get(requestId) || null;
  }
}

// Export singleton instance
export const mockContract = new MockContractService();
