"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useKYCStatus } from "@/hooks/use-kyc-status";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, User, X, Shield } from "lucide-react";
import { contractService } from "@/lib/contract-service";
import { useToast } from "@/hooks/use-toast";
import { useContractActions } from "@/hooks/use-contract-actions";
import { BorrowRequestExtended } from "@/lib/types";
import { parseUnits } from "viem";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const RequestSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  token: z.string().min(1, "Please select a token"),
  dueDate: z.string().min(1, "Due date is required"),
  overtimeInterest: z.string().min(1, "Overtime interest is required"),
});

type RequestFormData = z.infer<typeof RequestSchema>;

export default function BorrowerPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { createBorrowRequest, isPending: isContractPending } =
    useContractActions();
  const { isVerified: kycStatus } = useKYCStatus();
  const [myRequests, setMyRequests] = useState<BorrowRequestExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingRequest, setCancellingRequest] = useState<bigint | null>(
    null
  );
  const { toast } = useToast();

  // Available tokens
  const availableTokens = [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
      decimals: 6,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xabcdef1234567890abcdef1234567890abcdef12" as `0x${string}`,
      decimals: 6,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      address: "0x9876543210fedcba9876543210fedcba98765432" as `0x${string}`,
      decimals: 18,
    },
  ];

  const form = useForm<RequestFormData>({
    resolver: zodResolver(RequestSchema),
    defaultValues: {
      amount: "",
      token: "",
      dueDate: "",
      overtimeInterest: "10",
    },
  });

  // Mock verification status
  const creditGrade = { grade: "B" as const, hasGrade: true };
  const reclaimProof = { isValid: true };

  const formatAmount = (amount: bigint | undefined, decimals: number = 6) => {
    // 1 USDC = 1 dollar (1 USDC = 10^6 units)
    if (!amount || amount === undefined) {
      return "0";
    }
    const result = (Number(amount) / 10 ** decimals).toLocaleString();
    console.log(
      `💰 formatAmount: ${amount.toString()} / 10^${decimals} = ${result}`
    );
    return result;
  };

  const formatDueDate = (dueDate: number) => {
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.ceil((dueDate - now) / (24 * 60 * 60));
    return daysLeft > 0 ? `${daysLeft} days left` : "Overdue";
  };

  const getFundedPercentage = (
    amount: bigint | undefined,
    funded: bigint | undefined
  ) => {
    if (!amount || amount === BigInt(0) || !funded) return 0;
    return Number((funded * BigInt(100)) / amount);
  };

  // Get selected token for dynamic labels
  const selectedTokenSymbol = form.watch("token");
  const selectedToken = availableTokens.find(
    (token) => token.symbol === selectedTokenSymbol
  );

  const canCreateRequest =
    kycStatus && creditGrade.hasGrade && reclaimProof.isValid;

  const handleCancelRequest = async (requestId: bigint) => {
    if (!address) return;

    try {
      setCancellingRequest(requestId);

      // Get contract config
      const contractConfig = contractService.getContractConfig();

      // Cancel request using wagmi writeContract
      writeContract({
        ...contractConfig,
        functionName: "cancelBorrowRequest",
        args: [requestId],
      });
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cancel request",
        variant: "destructive",
      });
      setCancellingRequest(null);
    }
  };

  const onSubmit = async (data: RequestFormData) => {
    if (!canCreateRequest || !address) return;

    try {
      // Find selected token
      const selectedToken = availableTokens.find(
        (token) => token.symbol === data.token
      );
      if (!selectedToken) {
        toast({
          title: "Invalid Token",
          description: "Please select a valid token",
          variant: "destructive",
        });
        return;
      }

      // Parse amount to raw units using token decimals
      const amountRaw = parseUnits(data.amount, selectedToken.decimals);
      const dueUnix = Math.floor(new Date(data.dueDate).getTime() / 1000);

      // Validate due date is in the future
      if (dueUnix <= Math.floor(Date.now() / 1000)) {
        toast({
          title: "Invalid Date",
          description: "Due date must be in the future",
          variant: "destructive",
        });
        return;
      }

      // Create request using real contract
      const result = await createBorrowRequest(
        data.amount,
        dueUnix,
        parseInt(data.overtimeInterest),
        selectedToken.address
      );

      // Reset form after successful creation
      form.reset();
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create request",
        variant: "destructive",
      });
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      if (cancellingRequest) {
        toast({
          title: "Request Cancelled!",
          description: "Your borrow request has been cancelled successfully",
        });
        setCancellingRequest(null);

        // Remove cancelled request from UI immediately
        setMyRequests((prev) =>
          prev.filter((req) => req.id !== cancellingRequest)
        );
      } else {
        toast({
          title: "Request Created!",
          description: "Your borrow request has been created successfully",
        });
        form.reset();
      }

      // Refresh requests only for new requests, not for cancellations
      if (address && !cancellingRequest) {
        contractService
          .getBorrowRequestsByBorrower(address)
          .then(setMyRequests);
      }
    }
  }, [isSuccess, toast, form, address, cancellingRequest]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });

      // Reset cancelling request state on error
      if (cancellingRequest) {
        setCancellingRequest(null);
      }
    }
  }, [error, toast, cancellingRequest]);

  // Load data from mock contract
  useEffect(() => {
    const loadData = async () => {
      if (!address) return;

      try {
        console.log("🔄 Loading borrower data for address:", address);
        setIsLoading(true);
        const userRequests = await contractService.getBorrowRequestsByBorrower(
          address
        );
        console.log("📊 User requests loaded:", userRequests);
        setMyRequests(userRequests);
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

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Borrower Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Connect your wallet to start borrowing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <CreditCard className="h-4 w-4" />
            Borrower Panel
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Create Credit Request
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Complete your KYC verification, create income proof, and open your
            credit request
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Request Form & My Requests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        kycStatus
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        KYC Verification
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {kycStatus ? "Completed" : "Pending"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        creditGrade.hasGrade
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Badge className="text-xs">B</Badge>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        Credit Score
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {creditGrade.hasGrade
                          ? `Grade ${creditGrade.grade}`
                          : "Pending"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        reclaimProof.isValid
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        Income Proof
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {reclaimProof.isValid ? "Verified" : "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Borrow Request Form */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  New Credit Request
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Set your credit amount, term, and maximum interest rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Amount{" "}
                        {selectedToken ? `(${selectedToken.symbol})` : ""}
                      </label>
                      <Input
                        placeholder="10000"
                        {...form.register("amount")}
                        type="number"
                        disabled={!canCreateRequest}
                        className="h-12 text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Token
                      </label>
                      <Select
                        onValueChange={(value) => form.setValue("token", value)}
                        disabled={!canCreateRequest}
                      >
                        <SelectTrigger className="h-12 text-lg">
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTokens.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              {token.symbol} - {token.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Due Date
                      </label>
                      <Input
                        type="datetime-local"
                        {...form.register("dueDate")}
                        disabled={!canCreateRequest}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Overtime Interest Rate (%)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        {...form.register("overtimeInterest")}
                        disabled={!canCreateRequest}
                        className="h-12 text-lg"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl"
                    disabled={
                      !canCreateRequest ||
                      isPending ||
                      isConfirming ||
                      isContractPending
                    }
                  >
                    {isPending || isContractPending
                      ? "Confirming..."
                      : isConfirming
                      ? "Creating..."
                      : "Create Credit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Requests */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                  <CreditCard className="h-5 w-5" />
                  My Credit Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    Loading requests...
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">
                      No credit requests yet
                    </p>
                    <p className="text-sm">
                      Fill out the form above to create your first request
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map((request) => {
                      if (!request) return null;

                      return (
                        <div
                          key={
                            request.id?.toString() || Math.random().toString()
                          }
                          className="p-6 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200 bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {formatAmount(request.amount)} USDC
                                </h3>
                                <Badge
                                  variant={
                                    request.status === "Open"
                                      ? "secondary"
                                      : "default"
                                  }
                                  className="text-xs"
                                >
                                  {request.status === "Open"
                                    ? "Open"
                                    : request.status || "Unknown"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span>
                                  Due:{" "}
                                  {request.dueDate
                                    ? formatDueDate(request.dueDate)
                                    : "Not specified"}
                                </span>
                                <span>
                                  Funded:{" "}
                                  {getFundedPercentage(
                                    request.amount,
                                    request.funded
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${getFundedPercentage(
                                      request.amount,
                                      request.funded
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Not: B
                              </Badge>
                              {request.status === "Open" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelRequest(request.id)
                                  }
                                  disabled={
                                    cancellingRequest === request.id ||
                                    isPending ||
                                    isConfirming
                                  }
                                  className="text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  {cancellingRequest === request.id
                                    ? "Cancelling..."
                                    : "Cancel"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile & Stats */}
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
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
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
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      KYC Status
                    </span>
                    <Badge
                      variant={kycStatus ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {kycStatus ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Credit Score
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {creditGrade.grade}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Income Proof
                    </span>
                    <Badge
                      variant={reclaimProof.isValid ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {reclaimProof.isValid ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
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
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {myRequests.length}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Total Requests
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {myRequests.filter((r) => r.status === "Funded").length}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Funded
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    Active Debts
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      10,000 USDC - 15 days left
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      5,000 USDC - 30 days left
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
