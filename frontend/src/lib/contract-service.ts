import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "./contracts";
import { BorrowRequest, Loan, BorrowRequestExtended } from "./types";
import { getContract, createPublicClient, http } from "viem";
import { rise } from "./chains/rise";

// Create public client
const publicClient = createPublicClient({
  chain: rise,
  transport: http(
    process.env.NEXT_PUBLIC_RISE_RPC || "https://testnet.riselabs.xyz"
  ),
});

// Real contract service using viem
class ContractService {
  private requestBookContract: ReturnType<typeof getContract>;

  constructor() {
    this.requestBookContract = getContract({
      address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
      abi: CONTRACT_ABIS.RequestBook,
      client: publicClient,
    });
  }

  // Get contract address and ABI for frontend use
  getContractConfig() {
    return {
      address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
      abi: CONTRACT_ABIS.RequestBook,
    };
  }

  // Get a specific borrow request
  async getBorrowRequest(borrowID: bigint): Promise<BorrowRequest | null> {
    try {
      const request = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
        abi: CONTRACT_ABIS.RequestBook,
        functionName: "getBorrowRequest",
        args: [borrowID],
      });
      return {
        id: request.id,
        borrower: request.borrower,
        amount: request.amount,
        assetERC20Address: request.assetERC20Address,
      };
    } catch (error) {
      console.error("Error getting borrow request:", error);
      return null;
    }
  }

  // Get all loans for a lender
  async getAllLoans(lender: `0x${string}`): Promise<bigint[]> {
    try {
      return await this.requestBookContract.read.getAllLoans([lender]);
    } catch (error) {
      console.error("Error getting all loans:", error);
      return [];
    }
  }

  // Get borrow request IDs for a borrower
  async getBorrowRequestIDs(borrower: `0x${string}`): Promise<bigint[]> {
    try {
      // This would require a view function in the contract
      // For now, we'll implement a workaround by checking all IDs
      const nextID = await this.requestBookContract.read.nextID();
      const requestIDs: bigint[] = [];

      for (let i = BigInt(0); i < nextID; i++) {
        try {
          const request = await this.requestBookContract.read.borrowRequestByID(
            [i]
          );
          if (request.borrower.toLowerCase() === borrower.toLowerCase()) {
            requestIDs.push(i);
          }
        } catch {
          // Request doesn't exist, continue
        }
      }

      return requestIDs;
    } catch (error) {
      console.error("Error getting borrow request IDs:", error);
      return [];
    }
  }

  // Get loan details by borrow ID
  async getLoanByBorrowID(borrowID: bigint): Promise<Loan | null> {
    try {
      const loan = await this.requestBookContract.read.loanByBorrowID([
        borrowID,
      ]);
      return {
        isFilled: loan.isFilled,
        borrowID: loan.borrowID,
        lender: loan.lender,
      };
    } catch (error) {
      console.error("Error getting loan by borrow ID:", error);
      return null;
    }
  }

  // Check if a borrow request is cancelled
  async isBorrowRequestCancelled(borrowID: bigint): Promise<boolean> {
    try {
      return await this.requestBookContract.read.cancelledBorrowRequests([
        borrowID,
      ]);
    } catch (error) {
      console.error("Error checking if borrow request is cancelled:", error);
      return false;
    }
  }

  // Get all borrow requests (for marketplace)
  async getAllBorrowRequests(): Promise<BorrowRequestExtended[]> {
    try {
      const nextID = await this.requestBookContract.read.nextID();
      const requests: BorrowRequestExtended[] = [];

      for (let i = BigInt(0); i < nextID; i++) {
        try {
          const request = await this.requestBookContract.read.borrowRequestByID(
            [i]
          );
          const isCancelled = await this.isBorrowRequestCancelled(i);
          const loan = await this.getLoanByBorrowID(i);

          if (!isCancelled && request.borrower) {
            requests.push({
              id: request.id,
              borrower: request.borrower,
              amount: request.amount,
              assetERC20Address: request.assetERC20Address,
              status: loan?.isFilled ? "Funded" : "Open",
              funded: loan?.isFilled ? request.amount : BigInt(0),
            });
          }
        } catch {
          // Request doesn't exist, continue
        }
      }

      return requests;
    } catch (error) {
      console.error("Error getting all borrow requests:", error);
      return [];
    }
  }

  // Get borrow requests by borrower
  async getBorrowRequestsByBorrower(
    borrower: `0x${string}`
  ): Promise<BorrowRequestExtended[]> {
    try {
      const requestIDs = await this.getBorrowRequestIDs(borrower);
      const requests: BorrowRequestExtended[] = [];

      for (const id of requestIDs) {
        const request = await this.getBorrowRequest(id);
        if (request) {
          const isCancelled = await this.isBorrowRequestCancelled(id);
          const loan = await this.getLoanByBorrowID(id);

          if (!isCancelled) {
            requests.push({
              ...request,
              status: loan?.isFilled ? "Funded" : "Open",
              funded: loan?.isFilled ? request.amount : BigInt(0),
            });
          }
        }
      }

      return requests;
    } catch (error) {
      console.error("Error getting borrow requests by borrower:", error);
      return [];
    }
  }
}

// Export singleton instance
export const contractService = new ContractService();
