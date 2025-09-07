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
      const requestData = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
        abi: CONTRACT_ABIS.RequestBook,
        functionName: "borrowRequestByID",
        args: [borrowID],
      })) as [bigint, bigint, bigint, bigint, `0x${string}`, `0x${string}`];

      // Data from contract comes in array format [id, amount, deadline, overtime_interest, borrower, assetERC20Address]
      return {
        id: requestData[0],
        amount: requestData[1],
        deadline: requestData[2],
        overtime_interest: requestData[3],
        borrower: requestData[4],
        assetERC20Address: requestData[5],
      };
    } catch (error) {
      console.error("Error getting borrow request:", error);
      return null;
    }
  }

  // Get all loans for a lender
  async getAllLoans(lender: `0x${string}`): Promise<bigint[]> {
    try {
      return (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
        abi: CONTRACT_ABIS.RequestBook,
        functionName: "getAllLoans",
        args: [lender],
      })) as bigint[];
    } catch (error) {
      console.error("Error getting all loans:", error);
      return [];
    }
  }

  // Get borrow request IDs for a borrower
  async getBorrowRequestIDs(borrower: `0x${string}`): Promise<bigint[]> {
    try {
      // Try mapping approach first with limited attempts
      const requestIDs: bigint[] = [];
      const maxMappingAttempts = 5; // Limit attempts to prevent infinite loops

      for (let index = BigInt(0); index < BigInt(maxMappingAttempts); index++) {
        try {
          const requestID = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
            abi: CONTRACT_ABIS.RequestBook,
            functionName: "borrowRequestIDS",
            args: [borrower, index],
          })) as bigint;

          if (requestID && requestID > BigInt(0)) {
            requestIDs.push(requestID);
          } else {
            // No more requests for this borrower
            break;
          }
        } catch {
          // If we get an error, it means this index doesn't exist
          break;
        }
      }

      // If no requests found via mapping, fallback to checking all IDs
      if (requestIDs.length === 0) {
        try {
          const nextID = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
            abi: CONTRACT_ABIS.RequestBook,
            functionName: "nextID",
            args: [],
          })) as unknown as bigint;

          for (let i = BigInt(0); i < nextID; i++) {
            try {
              const requestData = (await publicClient.readContract({
                address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
                abi: CONTRACT_ABIS.RequestBook,
                functionName: "borrowRequestByID",
                args: [i],
              })) as [
                bigint,
                bigint,
                bigint,
                bigint,
                `0x${string}`,
                `0x${string}`
              ];
              // Data from contract comes in array format [id, amount, deadline, overtime_interest, borrower, assetERC20Address]
              const borrowerAddress = requestData[4]; // borrower is at index 4
              if (
                borrowerAddress &&
                borrowerAddress.toLowerCase() === borrower.toLowerCase()
              ) {
                requestIDs.push(i);
              }
            } catch {
              // Request doesn't exist, continue
              continue;
            }
          }
        } catch (error) {
          console.error("Error getting nextID:", error);
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
      const loan = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
        abi: CONTRACT_ABIS.RequestBook,
        functionName: "loanByBorrowID",
        args: [borrowID],
      })) as [boolean, bigint, `0x${string}`];
      return {
        isFilled: loan[0],
        borrowID: loan[1],
        lender: loan[2],
      };
    } catch (error) {
      console.error("Error getting loan by borrow ID:", error);
      return null;
    }
  }

  // Check if a borrow request is cancelled
  async isBorrowRequestCancelled(borrowID: bigint): Promise<boolean> {
    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
        abi: CONTRACT_ABIS.RequestBook,
        functionName: "cancelledBorrowRequests",
        args: [borrowID],
      });
      return result as unknown as boolean;
    } catch (error) {
      console.error("Error checking if borrow request is cancelled:", error);
      return false;
    }
  }

  // Get all borrow requests (for marketplace)
  async getAllBorrowRequests(): Promise<BorrowRequestExtended[]> {
    try {
      console.log("🔍 Getting all borrow requests...");
      const nextID = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
        abi: CONTRACT_ABIS.RequestBook,
        functionName: "nextID",
        args: [],
      })) as unknown as bigint;
      console.log("📊 Next ID:", nextID.toString());
      const requests: BorrowRequestExtended[] = [];

      // If nextID is 0, there are no requests
      if (nextID === BigInt(0)) {
        console.log("📊 No requests found (nextID = 0)");
        return [];
      }

      for (let i = BigInt(0); i < nextID; i++) {
        try {
          console.log(`🔍 Checking request ID: ${i.toString()}`);
          const requestData = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
            abi: CONTRACT_ABIS.RequestBook,
            functionName: "borrowRequestByID",
            args: [i],
          })) as [bigint, bigint, bigint, bigint, `0x${string}`, `0x${string}`];
          console.log("📋 Request data:", requestData);

          // Data from contract comes in array format [id, amount, deadline, overtime_interest, borrower, assetERC20Address]
          const request = {
            id: requestData[0],
            amount: requestData[1],
            deadline: requestData[2],
            overtime_interest: requestData[3],
            borrower: requestData[4],
            assetERC20Address: requestData[5],
          };

          console.log("📋 Raw request data:", requestData);
          console.log("📋 Parsed request:", request);

          // Skip if data is invalid (has undefined values)
          if (
            !request.id ||
            !request.amount ||
            !request.deadline ||
            !request.overtime_interest ||
            !request.borrower ||
            !request.assetERC20Address
          ) {
            console.log(
              `❌ Invalid request data for ID ${i.toString()}, skipping`
            );
            continue;
          }

          // Check if request data is valid
          if (
            !request ||
            !request.borrower ||
            request.borrower === "0x0000000000000000000000000000000000000000"
          ) {
            console.log(`❌ Invalid request data for ID ${i.toString()}`);
            continue;
          }

          const isCancelled = await this.isBorrowRequestCancelled(i);
          const loan = await this.getLoanByBorrowID(i);

          if (!isCancelled) {
            const requestData: BorrowRequestExtended = {
              id: request.id,
              borrower: request.borrower,
              amount: request.amount,
              deadline: request.deadline,
              overtime_interest: request.overtime_interest,
              assetERC20Address: request.assetERC20Address,
              status: loan?.isFilled ? "Funded" : "Open",
              funded: loan?.isFilled ? request.amount : BigInt(0),
              isOverdue:
                Number(request.deadline) < Math.floor(Date.now() / 1000),
              currentInterestRate: this.calculateCurrentInterestRate(
                request.deadline,
                request.overtime_interest
              ),
            };
            console.log("✅ Adding request:", requestData);
            requests.push(requestData);
          } else {
            console.log("❌ Skipping cancelled request:", i.toString());
          }
        } catch (error) {
          console.log(`❌ Error getting request ${i.toString()}:`, error);
          // No data for this ID, continue
        }
      }

      console.log("📊 Total requests found:", requests.length);
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
        try {
          const request = await this.getBorrowRequest(id);

          if (
            request &&
            request.amount &&
            request.deadline &&
            request.overtime_interest &&
            request.borrower &&
            request.assetERC20Address
          ) {
            const isCancelled = await this.isBorrowRequestCancelled(id);
            const loan = await this.getLoanByBorrowID(id);

            // Only add non-cancelled requests
            if (!isCancelled) {
              const requestData: BorrowRequestExtended = {
                ...request,
                status: loan?.isFilled ? "Funded" : "Open",
                funded: loan?.isFilled ? request.amount : BigInt(0),
                isOverdue:
                  Number(request.deadline) < Math.floor(Date.now() / 1000),
                currentInterestRate: this.calculateCurrentInterestRate(
                  request.deadline,
                  request.overtime_interest
                ),
              };
              requests.push(requestData);
            }
          }
        } catch {
          // Continue with next request
          continue;
        }
      }

      return requests;
    } catch (error) {
      console.error("Error getting borrow requests by borrower:", error);
      return [];
    }
  }

  // Cancel a borrow request
  async cancelBorrowRequest(borrowID: bigint): Promise<boolean> {
    try {
      console.log("🚫 Cancelling borrow request:", borrowID.toString());

      // This would be called from the frontend using wagmi writeContract
      // For now, we'll just return true as the actual transaction will be handled by wagmi
      return true;
    } catch (error) {
      console.error("Error cancelling borrow request:", error);
      return false;
    }
  }

  // Fund a borrow request (createLoan)
  async fundBorrowRequest(borrowID: bigint): Promise<boolean> {
    try {
      console.log("💰 Funding borrow request:", borrowID.toString());

      // This would be called from the frontend using wagmi writeContract
      // For now, we'll just return true as the actual transaction will be handled by wagmi
      return true;
    } catch (error) {
      console.error("Error funding borrow request:", error);
      return false;
    }
  }

  // Repay a loan
  async repayLoan(borrowID: bigint): Promise<boolean> {
    try {
      console.log("💳 Repaying loan:", borrowID.toString());

      // This would be called from the frontend using wagmi writeContract
      // For now, we'll just return true as the actual transaction will be handled by wagmi
      return true;
    } catch (error) {
      console.error("Error repaying loan:", error);
      return false;
    }
  }

  // Calculate current interest rate based on overdue days
  private calculateCurrentInterestRate(
    deadline: bigint,
    overtimeInterest: bigint
  ): number {
    const now = Math.floor(Date.now() / 1000);
    const overdueDays = Math.max(0, now - Number(deadline));

    if (overdueDays >= 9) {
      return Number(overtimeInterest) * 2.5; // 5/2 multiplier
    } else if (overdueDays >= 6) {
      return Number(overtimeInterest) * 2; // 2x multiplier
    } else if (overdueDays >= 3) {
      return Number(overtimeInterest) * 1.5; // 3/2 multiplier
    }

    return Number(overtimeInterest); // Base rate
  }

  // Get repayment amount for a loan
  async getRepaymentAmount(borrowID: bigint): Promise<bigint | null> {
    try {
      const request = await this.getBorrowRequest(borrowID);
      if (!request) return null;

      const now = Math.floor(Date.now() / 1000);
      const overdueDays = Math.max(0, now - Number(request.deadline));

      let interestMultiplier = 1;
      if (overdueDays >= 9) {
        interestMultiplier = 2.5; // 5/2
      } else if (overdueDays >= 6) {
        interestMultiplier = 2;
      } else if (overdueDays >= 3) {
        interestMultiplier = 1.5; // 3/2
      }

      const interest = BigInt(
        Math.floor(Number(request.overtime_interest) * interestMultiplier)
      );
      const repayAmount =
        (request.amount * BigInt(100 + Number(interest))) / BigInt(100);

      return repayAmount;
    } catch (error) {
      console.error("Error calculating repayment amount:", error);
      return null;
    }
  }
}

// Export singleton instance
export const contractService = new ContractService();
