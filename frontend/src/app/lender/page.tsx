"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
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
import { mockContract } from "@/lib/mock-contract";
import { useToast } from "@/hooks/use-toast";
import { BorrowRequest, Lending } from "@/lib/types";

export default function LenderPage() {
  const { address, isConnected } = useAccount();
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [myLendings, setMyLendings] = useState<Lending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock verification status
  const kycStatus = { isVerified: true };
  const creditGrade = { grade: "B" as const, hasGrade: true };
  const reclaimProof = { isValid: true };

  const formatAmount = (amount: bigint, decimals: number = 6) => {
    return (Number(amount) / 10 ** decimals).toLocaleString();
  };

  const formatDueDate = (dueDate: number) => {
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.ceil((dueDate - now) / (24 * 60 * 60));
    return daysLeft > 0 ? `${daysLeft} days left` : "Overdue";
  };

  const getFundedPercentage = (amount: bigint, funded: bigint) => {
    return Number((funded * BigInt(100)) / amount);
  };

  // Load data from mock contract
  useEffect(() => {
    const loadData = async () => {
      if (!address) return;

      try {
        setIsLoading(true);
        const [allRequests, userLendings] = await Promise.all([
          mockContract.getAllRequests(),
          mockContract.getLendingsByLender(address),
        ]);

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

  const handleFund = async (requestId: bigint, amount: bigint) => {
    if (!address) return;

    try {
      await mockContract.fundRequest(requestId, address, amount);

      // Refresh data
      const [allRequests, userLendings] = await Promise.all([
        mockContract.getAllRequests(),
        mockContract.getLendingsByLender(address),
      ]);

      setBorrowRequests(allRequests);
      setMyLendings(userLendings);

      toast({
        title: "Success!",
        description: "Request funded successfully",
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
                        {request.borrower.slice(0, 6)}...
                        {request.borrower.slice(-4)} •{" "}
                        {formatDueDate(request.dueDate)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getFundedPercentage(request.amount, request.funded)}%
                        funded
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FundDialog request={request} onFund={handleFund}>
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
