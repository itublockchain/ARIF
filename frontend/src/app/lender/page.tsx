"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, DollarSign } from "lucide-react";
import { FundDialog } from "@/components/FundDialog";
import { RiskScoreCard } from "@/components/RiskScoreCard";
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
  const [fundingRequest, setFundingRequest] = useState<{
    id: bigint;
    amount: bigint;
  } | null>(null);
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

  // Mock verification status - not used in lender page
  // const kycStatus = { isVerified: true };
  // const creditGrade = { grade: "B" as const, hasGrade: true };
  // const reclaimProof = { isValid: true };

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
        const [allRequests, loanIds] = await Promise.all([
          contractService.getAllBorrowRequests(),
          contractService.getAllLoans(address),
        ]);

        console.log("📊 All requests loaded:", allRequests);
        console.log("💰 User loan IDs loaded:", loanIds);
        setBorrowRequests(allRequests);

        // Convert loan IDs to Lending objects
        const userLendings: Lending[] = [];
        for (const loanId of loanIds) {
          const request = allRequests.find((r) => r.id === loanId);
          if (request) {
            userLendings.push({
              requestId: loanId,
              lender: address,
              token: request.assetERC20Address,
              amount: request.amount,
              dueDate:
                request.dueDate ||
                Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              borrower: request.borrower,
            });
          }
        }

        // If no real lendings found, show mock data for demo
        if (userLendings.length === 0) {
          console.log("📊 No real lendings found, showing mock data for demo");
          const mockLendings: Lending[] = [
            {
              requestId: BigInt(1),
              lender: address,
              token:
                "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
              amount: BigInt(500000000), // 500 USDC
              dueDate: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60, // 15 days
              borrower:
                "0xF43F43D8aee114a71B164e1f6214BC7625a5742D" as `0x${string}`,
            },
            {
              requestId: BigInt(2),
              lender: address,
              token:
                "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
              amount: BigInt(1000000000), // 1000 USDC
              dueDate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
              borrower:
                "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
            },
          ];
          setMyLendings(mockLendings);
        } else {
          setMyLendings(userLendings);
        }
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

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && address) {
      if (pendingApproval) {
        toast({
          title: "Approval Successful!",
          description: "USDC approved for lending",
        });
        setPendingApproval(null);
      } else if (fundingRequest) {
        toast({
          title: "Funding Successful!",
          description: `Successfully funded ${formatAmount(
            fundingRequest.amount
          )} USDC`,
        });

        // Add to My Lendings immediately
        const request = borrowRequests.find((r) => r.id === fundingRequest.id);
        if (request) {
          const newLending: Lending = {
            requestId: fundingRequest.id,
            lender: address,
            token: request.assetERC20Address,
            amount: fundingRequest.amount,
            dueDate:
              request.dueDate ||
              Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            borrower: request.borrower,
          };
          setMyLendings((prev) => [...prev, newLending]);
          console.log("✅ Added new lending to My Lendings:", newLending);
        }

        setFundingRequest(null);

        // Refresh borrow requests to update funding status
        contractService.getAllBorrowRequests().then(setBorrowRequests);
      }
    }
  }, [
    isSuccess,
    toast,
    address,
    pendingApproval,
    fundingRequest,
    borrowRequests,
  ]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });

      // Reset funding request state on error
      if (fundingRequest) {
        setFundingRequest(null);
      }
    }
  }, [error, toast, fundingRequest]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            Investor Panel
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Review Credit Requests
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
            Invest in reliable borrowers and earn interest
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Borrow Requests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Open Credit Requests
              </h2>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {borrowRequests.length} requests found
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading requests...
              </div>
            ) : borrowRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No credit requests yet</p>
                <p className="text-sm">
                  New requests will appear here when available
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {borrowRequests.map((request) => (
                  <Card
                    key={request.id.toString()}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white dark:bg-slate-800"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-900">
                              {formatAmount(request.amount)} USDC
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              Grade B
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {request.borrower
                                ? `${request.borrower.slice(
                                    0,
                                    6
                                  )}...${request.borrower.slice(-4)}`
                                : "Bilinmiyor"}
                            </span>
                            <span>
                              Due:{" "}
                              {request.dueDate
                                ? formatDueDate(request.dueDate)
                                : "Not specified"}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-300">
                                Funding Status
                              </span>
                              <span className="font-medium">
                                {getFundedPercentage(
                                  request.amount,
                                  request.funded || BigInt(0)
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${getFundedPercentage(
                                    request.amount,
                                    request.funded || BigInt(0)
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-6">
                          <FundDialog
                            request={request}
                            onApprove={handleApprove}
                            allowance={allowance}
                            isPending={
                              isPending ||
                              isConfirming ||
                              fundingRequest?.id === request.id
                            }
                          >
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                              disabled={
                                isPending ||
                                isConfirming ||
                                fundingRequest?.id === request.id
                              }
                            >
                              {fundingRequest?.id === request.id
                                ? "Funding..."
                                : "Fund"}
                            </Button>
                          </FundDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Profile & My Lendings */}
          <div className="space-y-6">
            {/* AI Risk Assessment */}
            <RiskScoreCard />

            {/* Profile Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      Wallet Address
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      USDC Balance
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {allowance ? formatAmount(allowance) : "0"} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Active Investment
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {myLendings.length} adet
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Lendings Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  <DollarSign className="h-5 w-5" />
                  My Investments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    Loading investments...
                  </div>
                ) : myLendings.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                    <DollarSign className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No investments yet</p>
                    <p className="text-xs">Start by funding credit requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myLendings.map((lending, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatAmount(lending.amount)} USDC
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          Borrower: {lending.borrower.slice(0, 6)}...
                          {lending.borrower.slice(-4)}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          Due: {formatDueDate(lending.dueDate)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {myLendings.length}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Active Investment
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {myLendings.reduce(
                        (sum, lending) => sum + Number(lending.amount),
                        0
                      ) / 1000000}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Total USDC
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Expected Return
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      +12.5% APY
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Average interest rate
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
