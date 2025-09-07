"use client";

import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";
import { parseUnits } from "viem";

export function useContractActions() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  // Create borrow request
  const createBorrowRequest = async (
    amount: string,
    deadline: number,
    overtimeInterest: number,
    assetAddress: `0x${string}`
  ) => {
    if (!address) {
      throw new Error("Please connect your wallet");
    }

    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
    const overtimeInterestBps = BigInt(overtimeInterest * 100); // Convert percentage to basis points

    return new Promise<{ hash: string; requestId: bigint }>(
      (resolve, reject) => {
        writeContract(
          {
            address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
            abi: CONTRACT_ABIS.RequestBook,
            functionName: "createBorrowRequest",
            args: [
              amountWei,
              BigInt(deadline),
              overtimeInterestBps,
              assetAddress,
            ],
          },
          {
            onSuccess: async (hash) => {
              try {
                if (!publicClient) {
                  throw new Error("Public client not available");
                }

                // Wait for transaction to be mined
                await publicClient.waitForTransactionReceipt({
                  hash: hash as `0x${string}`,
                });

                // Get the request ID by reading the nextID from the contract
                // Since the contract increments nextID after creating a request,
                // the created request ID is nextID - 1
                let requestId: bigint | null = null;

                if (publicClient) {
                  const nextID = await publicClient.readContract({
                    address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
                    abi: CONTRACT_ABIS.RequestBook,
                    functionName: "nextID",
                    args: [],
                  });
                  requestId = (nextID as bigint) - 1n; // The ID that was just created
                }

                toast({
                  title: "Request Created!",
                  description: `Request #${requestId?.toString()} created successfully`,
                });

                resolve({ hash, requestId: requestId! });
              } catch (error) {
                console.error("Error getting request ID:", error);
                toast({
                  title: "Request Created!",
                  description: `Transaction hash: ${hash.slice(0, 10)}...`,
                });
                // Fallback: return hash without request ID
                resolve({ hash, requestId: 0n });
              }
            },
            onError: (error) => {
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
              });
              reject(error);
            },
          }
        );
      }
    );
  };

  // Fund a borrow request (createLoan)
  const fundBorrowRequest = async (borrowID: bigint) => {
    if (!address) {
      throw new Error("Please connect your wallet");
    }

    return new Promise<string>((resolve, reject) => {
      writeContract(
        {
          address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
          abi: CONTRACT_ABIS.RequestBook,
          functionName: "createLoan",
          args: [borrowID],
        },
        {
          onSuccess: (hash) => {
            toast({
              title: "Request Funded!",
              description: `Transaction hash: ${hash.slice(0, 10)}...`,
            });
            resolve(hash);
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
            reject(error);
          },
        }
      );
    });
  };

  // Repay a loan
  const repayLoan = async (borrowID: bigint) => {
    if (!address) {
      throw new Error("Please connect your wallet");
    }

    return new Promise<string>((resolve, reject) => {
      writeContract(
        {
          address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
          abi: CONTRACT_ABIS.RequestBook,
          functionName: "repayLoan",
          args: [borrowID],
        },
        {
          onSuccess: (hash) => {
            toast({
              title: "Loan Repaid!",
              description: `Transaction hash: ${hash.slice(0, 10)}...`,
            });
            resolve(hash);
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
            reject(error);
          },
        }
      );
    });
  };

  // Cancel a borrow request
  const cancelBorrowRequest = async (borrowID: bigint) => {
    if (!address) {
      throw new Error("Please connect your wallet");
    }

    return new Promise<string>((resolve, reject) => {
      writeContract(
        {
          address: CONTRACT_ADDRESSES.RequestBook as `0x${string}`,
          abi: CONTRACT_ABIS.RequestBook,
          functionName: "cancelBorrowRequest",
          args: [borrowID],
        },
        {
          onSuccess: (hash) => {
            toast({
              title: "Request Cancelled!",
              description: `Transaction hash: ${hash.slice(0, 10)}...`,
            });
            resolve(hash);
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
            reject(error);
          },
        }
      );
    });
  };

  return {
    createBorrowRequest,
    fundBorrowRequest,
    repayLoan,
    cancelBorrowRequest,
    isPending,
  };
}
