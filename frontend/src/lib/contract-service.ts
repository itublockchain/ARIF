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
      })) as [bigint, bigint, `0x${string}`, `0x${string}`];

      // Data from contract comes in array format [id, amount, borrower, assetERC20Address]
      return {
        id: requestData[0],
        borrower: requestData[2],
        amount: requestData[1],
        assetERC20Address: requestData[3],
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
      // This would require a view function in the contract
      // For now, we'll implement a workaround by checking all IDs
      const nextID = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
        abi: CONTRACT_ABIS.RequestBook,
        functionName: "nextID",
        args: [],
      })) as unknown as bigint;
      const requestIDs: bigint[] = [];

      for (let i = BigInt(0); i < nextID; i++) {
        try {
          const requestData = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
            abi: CONTRACT_ABIS.RequestBook,
            functionName: "borrowRequestByID",
            args: [i],
          })) as [bigint, bigint, `0x${string}`, `0x${string}`];
          // Data from contract comes in array format [id, amount, borrower, assetERC20Address]
          const borrowerAddress = requestData[2];
          if (
            borrowerAddress &&
            borrowerAddress.toLowerCase() === borrower.toLowerCase()
          ) {
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
          })) as [bigint, bigint, `0x${string}`, `0x${string}`];
          console.log("📋 Request data:", requestData);

          // Data from contract comes in array format [id, amount, borrower, assetERC20Address]
          const request = {
            id: requestData[0],
            amount: requestData[1],
            borrower: requestData[2],
            assetERC20Address: requestData[3],
          };

          console.log("📋 Raw request data:", requestData);
          console.log("📋 Parsed request:", request);

          // Skip if data is invalid (has undefined values)
          if (
            !request.id ||
            !request.amount ||
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
              assetERC20Address: request.assetERC20Address,
              status: loan?.isFilled ? "Funded" : "Open",
              funded: loan?.isFilled ? request.amount : BigInt(0),
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
      console.log("🔍 Getting borrow requests for borrower:", borrower);
      const requestIDs = await this.getBorrowRequestIDs(borrower);
      console.log("📊 Found request IDs:", requestIDs);
      const requests: BorrowRequestExtended[] = [];

      for (const id of requestIDs) {
        try {
          const request = await this.getBorrowRequest(id);
          console.log(`📋 Request ${id.toString()}:`, request);

          if (
            request &&
            request.amount &&
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
              };
              console.log("✅ Adding borrower request:", requestData);
              requests.push(requestData);
            } else {
              console.log("❌ Skipping cancelled request:", id.toString());
            }
          } else {
            console.log(
              `❌ Invalid request data for ID ${id.toString()}, skipping`
            );
          }
        } catch (error) {
          console.log(`❌ Error processing request ${id.toString()}:`, error);
          // Continue with next request
        }
      }

      // If no real data found, return empty array instead of mock data
      // This prevents showing cancelled requests in mock data
      console.log("📊 Total borrower requests found:", requests.length);
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

  // Fund a borrow request
  async fundBorrowRequest(borrowID: bigint, amount: bigint): Promise<boolean> {
    try {
      console.log(
        "💰 Funding borrow request:",
        borrowID.toString(),
        "Amount:",
        amount.toString()
      );

      // This would be called from the frontend using wagmi writeContract
      // For now, we'll just return true as the actual transaction will be handled by wagmi
      return true;
    } catch (error) {
      console.error("Error funding borrow request:", error);
      return false;
    }
  }
}

// Export singleton instance
export const contractService = new ContractService();
