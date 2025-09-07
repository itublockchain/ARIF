"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useKYCStatus } from "@/hooks/use-kyc-status";
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
import { CreditCard, User, X } from "lucide-react";
import { contractService } from "@/lib/contract-service";
import { useToast } from "@/hooks/use-toast";
import { BorrowRequestExtended } from "@/lib/types";
import { parseUnits } from "viem";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const RequestSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  token: z.string().min(1, "Please select a token"),
  dueDate: z.string().min(1, "Due date is required"),
});

type RequestFormData = z.infer<typeof RequestSchema>;

export default function BorrowerPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
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

      // Get contract config
      const contractConfig = contractService.getContractConfig();

      // Create request using wagmi writeContract
      writeContract({
        ...contractConfig,
        functionName: "createBorrowRequest",
        args: [amountRaw, selectedToken.address],
      });
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">BORROWER PAGE</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Request Form & My Requests */}
        <div className="lg:col-span-2 space-y-4">
          {/* Borrow Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Burada istek acabilcek</CardTitle>
              <CardDescription>Create a new loan request</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Amount {selectedToken ? `(${selectedToken.symbol})` : ""}
                    </label>
                    <Input
                      placeholder="10000"
                      {...form.register("amount")}
                      type="number"
                      disabled={!canCreateRequest}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Token</label>
                    <Select
                      onValueChange={(value) => form.setValue("token", value)}
                      disabled={!canCreateRequest}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a token" />
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

                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="datetime-local"
                      {...form.register("dueDate")}
                      disabled={!canCreateRequest}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canCreateRequest || isPending || isConfirming}
                  size="lg"
                >
                  {isPending
                    ? "Confirming..."
                    : isConfirming
                    ? "Creating..."
                    : "Create Borrow Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                My Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading requests...
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No requests yet
                </div>
              ) : (
                myRequests.map((request) => {
                  if (!request) return null;

                  return (
                    <div
                      key={request.id?.toString() || Math.random().toString()}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {formatAmount(request.amount)} USDC istiyom
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Due:{" "}
                          {request.dueDate
                            ? formatDueDate(request.dueDate)
                            : "No due date"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Funded:{" "}
                          {getFundedPercentage(request.amount, request.funded)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Score: 87</Badge>
                        <Badge
                          variant={
                            request.status === "Open" ? "secondary" : "default"
                          }
                        >
                          {request.status || "Unknown"}
                        </Badge>
                        {request.status === "Open" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={
                              cancellingRequest === request.id ||
                              isPending ||
                              isConfirming
                            }
                          >
                            <X className="h-3 w-3 mr-1" />
                            {cancellingRequest === request.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile & My Debts */}
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

          {/* My Debts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">My Debts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium">10 borcum var x&apos;e</div>
              <div className="text-sm font-medium">5 borcum var y&apos;ye</div>
              <div className="text-sm font-medium">15 borcum var z&apos;ye</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
