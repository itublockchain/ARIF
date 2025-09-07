"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useKYCStatus } from "@/hooks/use-kyc-status";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useContractActions } from "@/hooks/use-contract-actions";

const RequestSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  token: z.string().min(1, "Please select a token"),
  dueDate: z.string().min(1, "Due date is required"),
  overtimeInterest: z.string().min(1, "Overtime interest is required"),
});

type RequestFormData = z.infer<typeof RequestSchema>;

export default function NewBorrowPage() {
  const { address, isConnected } = useAccount();
  const { isVerified: kycStatus } = useKYCStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<bigint | null>(null);
  const { toast } = useToast();
  const { createBorrowRequest, isPending } = useContractActions();

  // Mock verification status
  const creditGrade = { hasGrade: true, grade: "B" as const };
  const reclaimProof = { isValid: true };

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
      overtimeInterest: "",
    },
  });

  const canCreateRequest =
    kycStatus && creditGrade.hasGrade && reclaimProof.isValid;

  // Get selected token for dynamic labels
  const selectedTokenSymbol = form.watch("token");
  const selectedToken = availableTokens.find(
    (token) => token.symbol === selectedTokenSymbol
  );

  const onSubmit = async (data: RequestFormData) => {
    if (!canCreateRequest || !address) return;

    setIsSubmitting(true);

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
        setIsSubmitting(false);
        return;
      }

      // Parse due date to unix timestamp
      const dueUnix = Math.floor(new Date(data.dueDate).getTime() / 1000);

      // Validate due date is in the future
      if (dueUnix <= Math.floor(Date.now() / 1000)) {
        toast({
          title: "Invalid Date",
          description: "Due date must be in the future",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate overtime interest is reasonable (1-50%)
      const overtimeInterestPercent = parseInt(data.overtimeInterest);
      if (overtimeInterestPercent < 1 || overtimeInterestPercent > 50) {
        toast({
          title: "Invalid Interest Rate",
          description: "Overtime interest must be between 1% and 50%",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        // Create request using real contract
        const result = await createBorrowRequest(
          data.amount,
          dueUnix,
          parseInt(data.overtimeInterest),
          selectedToken.address
        );

        // Use the real request ID from the contract
        setRequestId(result.requestId);
        setSubmitted(true);

        // Toast is already shown in the hook
      } catch (error) {
        console.error("Error creating request:", error);
        throw error; // Re-throw to be caught by the outer try-catch
      }
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Create Borrow Request</h1>
          <p className="text-muted-foreground text-lg">
            Create a new loan request to get funded by lenders
          </p>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to create a borrow request
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Request Created!</h1>
            <p className="text-muted-foreground text-lg">
              Your borrow request #{requestId?.toString()} has been submitted
              and is now visible to lenders
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Request Details:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Amount: {form.watch("amount")} USDC</div>
                <div>
                  Due Date:{" "}
                  {new Date(form.watch("dueDate")).toLocaleDateString()}
                </div>
                <div>Token: {form.watch("token")}</div>
                <div>Overtime Interest: {form.watch("overtimeInterest")}%</div>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Borrow Request</h1>
          <p className="text-muted-foreground">
            Set your loan terms and get funded by lenders
          </p>
        </div>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Status</CardTitle>
          <CardDescription>
            Complete verification to create borrow requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">KYC Verification</span>
            <div className="flex items-center gap-2">
              {kycStatus ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <Badge variant={kycStatus ? "default" : "destructive"}>
                {kycStatus ? "Verified" : "Not Verified"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Credit Grade</span>
            <div className="flex items-center gap-2">
              {creditGrade.hasGrade ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <Badge variant={creditGrade.hasGrade ? "default" : "destructive"}>
                {creditGrade.hasGrade
                  ? `Grade ${creditGrade.grade}`
                  : "Not Available"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Financial Proof</span>
            <div className="flex items-center gap-2">
              {reclaimProof.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <Badge variant={reclaimProof.isValid ? "default" : "destructive"}>
                {reclaimProof.isValid ? "Verified" : "Not Verified"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {!canCreateRequest && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete all verification steps to create borrow requests.{" "}
            <Link href="/verify" className="underline">
              Start verification
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Borrow Request Details</CardTitle>
          <CardDescription>
            Set your loan terms and requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="amount"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount {selectedToken ? `(${selectedToken.symbol})` : ""}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedToken ? `10000` : "10000"}
                        {...field}
                        disabled={!canCreateRequest}
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="token"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canCreateRequest}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a token" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTokens.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {token.symbol}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {token.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="dueDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={!canCreateRequest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="overtimeInterest"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10"
                        {...field}
                        disabled={!canCreateRequest}
                        type="number"
                        min="1"
                        max="50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Request Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    Amount: {form.watch("amount") || "0"}{" "}
                    {selectedToken?.symbol || ""}
                  </div>
                  <div>
                    Token:{" "}
                    {selectedToken
                      ? `${selectedToken.symbol} - ${selectedToken.name}`
                      : "Not selected"}
                  </div>
                  <div>Due: {form.watch("dueDate") || "Not set"}</div>
                  <div>
                    Overtime Interest: {form.watch("overtimeInterest") || "0"}%
                  </div>
                  <div>
                    Borrower: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <div>Credit Grade: {creditGrade.grade}</div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!canCreateRequest || isSubmitting || isPending}
                size="lg"
              >
                {isSubmitting || isPending
                  ? "Creating Request..."
                  : "Create Borrow Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
