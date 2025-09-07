"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  User,
} from "lucide-react";
import { FundDialog } from "@/components/FundDialog";
import { contractService } from "@/lib/contract-service";
import { useToast } from "@/hooks/use-toast";
import { BorrowRequestExtended, Lending } from "@/lib/types";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";

export default function LenderPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequestExtended[]>(
    []
  );
  const [myLendings, setMyLendings] = useState<Lending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState<bigint | null>(null);
  const { toast } = useToast();

  // Check USDC allowance
  const { data: allowance } = useReadContract({
    address: CONTRACT_ADDRESSES.TestUSDC as `0x${string}`,
    abi: CONTRACT_ABIS.TestUSDC,
    functionName: "allowance",
    args: address
      ? [address, CONTRACT_ADDRESSES.RequestBook as `0x${string}`]
      : undefined,
  });

  // Mock verification status
  const kycStatus = { isVerified: true };
  const creditGrade = { grade: "B" as const, hasGrade: true };
  const reclaimProof = { isValid: true };

  const formatAmount = (amount: bigint, decimals: number = 6) => {
    // 1 USDC = 1 dollar (1 USDC = 10^6 units)
    const result = (Number(amount) / 10 ** decimals).toLocaleString();
    return result;
  };

  const formatDueDate = (dueDate: number) => {
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.ceil((dueDate - now) / (24 * 60 * 60));
    return daysLeft > 0 ? `${daysLeft} days left` : "Overdue";
  };

  const getFundedPercentage = (amount: bigint, funded: bigint) => {
    if (!amount || amount === BigInt(0)) return 0;
    return Number((funded * BigInt(100)) / amount);
  };

  // Load data from mock contract
  useEffect(() => {
    const loadData = async () => {
      if (!address) return;

      try {
        console.log("🔄 Loading lender data for address:", address);
        setIsLoading(true);
        const [allRequests, userLendings] = await Promise.all([
          contractService.getAllBorrowRequests(),
          contractService.getAllLoans(address),
        ]);

        console.log("📊 All requests loaded:", allRequests);
        console.log("💰 User lendings loaded:", userLendings);
        setBorrowRequests(allRequests);
        setMyLendings(userLendings);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [address, toast]);

  const handleApprove = async (amount: bigint) => {
    if (!address) return;

    try {
      setPendingApproval(amount);
      writeContract({
        address: CONTRACT_ADDRESSES.TestUSDC as `0x${string}`,
        abi: CONTRACT_ABIS.TestUSDC,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.RequestBook as `0x${string}`, amount],
      });
    } catch (error) {
      console.error("Error approving USDC:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to approve USDC",
        variant: "destructive",
      });
      setPendingApproval(null);
    }
  };

  const handleFund = async (requestId: bigint, amount: bigint) => {
    if (!address) return;

    try {
      // Simulate USDC transfer (mock implementation)
      const request = borrowRequests.find((r) => r.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // For demo purposes, we'll simulate the transfer
      console.log(
        `Simulating transfer of ${formatAmount(amount)} USDC to ${
          request.borrower
        }`
      );

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update UI immediately (in real app, this would be done after transaction confirmation)
      toast({
        title: "Success!",
        description: `Successfully funded ${formatAmount(amount)} USDC`,
      });

      // Refresh data
      Promise.all([
        contractService.getAllBorrowRequests(),
        contractService.getAllLoans(address),
      ]).then(([allRequests, userLendings]) => {
        setBorrowRequests(allRequests);
        setMyLendings(userLendings);
      });
    } catch (error) {
      console.error("Error funding request:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fund request",
        variant: "destructive",
      });
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && address) {
      if (pendingApproval) {
        toast({
          title: "Approval Successful!",
          description: "USDC approved for lending",
        });
        setPendingApproval(null);
      }
    }
  }, [isSuccess, toast, address, pendingApproval]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fund request",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Lender Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Connect your wallet to start lending
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">LENDER PAGE</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Borrow Requests (Compact List) */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requests...
            </div>
          ) : borrowRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No borrow requests available
            </div>
          ) : (
            <div className="space-y-3">
              {borrowRequests.map((request) => (
                <Card key={request.id.toString()} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {formatAmount(request.amount)} USDC istiyor
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.borrower
                          ? `${request.borrower.slice(
                              0,
                              6
                            )}...${request.borrower.slice(-4)}`
                          : "Unknown"}{" "}
                        •{" "}
                        {request.dueDate
                          ? formatDueDate(request.dueDate)
                          : "No due date"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getFundedPercentage(
                          request.amount,
                          request.funded || BigInt(0)
                        )}
                        % funded
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FundDialog
                        request={request}
                        onFund={handleFund}
                        onApprove={handleApprove}
                        allowance={allowance}
                        isPending={isPending || isConfirming}
                      >
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                        >
                          Fund
                        </Badge>
                      </FundDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Profile & My Lendings */}
        <div className="space-y-4">
          {/* Profile Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Profil</CardTitle>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </CardContent>
          </Card>

          {/* My Lendings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                My Lendings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading lendings...
                </div>
              ) : myLendings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No lendings yet
                </div>
              ) : (
                myLendings.map((lending, index) => (
                  <div key={index} className="text-sm font-medium">
                    {formatAmount(lending.amount)} borç verdim{" "}
                    {lending.borrower.slice(0, 6)}...
                    {lending.borrower.slice(-4)}'e
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
