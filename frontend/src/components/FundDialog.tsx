"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, AlertCircle } from "lucide-react";
import { BorrowRequestExtended } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useContractActions } from "@/hooks/use-contract-actions";

interface FundDialogProps {
  request: BorrowRequestExtended;
  onApprove: (amount: bigint) => Promise<void>;
  allowance?: bigint;
  isPending?: boolean;
  children: React.ReactNode;
  onFundSuccess?: () => void;
}

export function FundDialog({
  request,
  onApprove,
  allowance,
  isPending,
  children,
  onFundSuccess,
}: FundDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { fundBorrowRequest, isPending: isContractPending } =
    useContractActions();

  // EARLY RETURN: If request is already funded, don't render anything
  if (request.isFunded) {
    return null;
  }

  const remainingAmount = request.amount - (request.funded || BigInt(0));
  const needsApproval = !allowance || allowance < remainingAmount;

  const handleApprove = async () => {
    if (isApproving) return;

    try {
      setError(null);
      setIsApproving(true);

      await onApprove(remainingAmount);

      toast({
        title: "Approval Successful!",
        description: `Approved ${formatAmount(
          remainingAmount
        )} USDC, now funding request...`,
      });

      // After successful approval, automatically start funding
      setTimeout(() => {
        handleFund();
      }, 1000); // Wait 1 second for approval to be processed
    } catch (err) {
      let errorMessage = "Failed to approve USDC";

      if (err instanceof Error) {
        if (
          err.message.includes("User denied") ||
          err.message.includes("User rejected")
        ) {
          errorMessage =
            "Approval was cancelled. Please try again if you want to fund this request.";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage =
            "Insufficient USDC balance for approval. Please check your wallet.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      toast({
        title: "Approval Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleFund = async () => {
    if (isFunding || remainingAmount <= 0) return;

    try {
      setError(null);
      setIsFunding(true);

      // Use real contract call instead of mock
      await fundBorrowRequest(request.id);

      // Call success callback if provided
      onFundSuccess?.();

      setIsOpen(false);
    } catch (err) {
      let errorMessage = "Failed to fund request";

      if (err instanceof Error) {
        // Handle specific error cases
        if (
          err.message.includes("User denied") ||
          err.message.includes("User rejected")
        ) {
          errorMessage =
            "Transaction was cancelled. Please try again if you want to fund this request.";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient USDC balance. Please check your wallet.";
        } else if (err.message.includes("gas")) {
          errorMessage =
            "Transaction failed due to gas issues. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      toast({
        title: "Funding Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFunding(false);
    }
  };

  const formatAmount = (amount: bigint, decimals: number = 6) => {
    // 1 USDC = 1 dollar (1 USDC = 10^6 units)
    return (Number(amount) / 10 ** decimals).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Fund Request
          </DialogTitle>
          <DialogDescription>
            Fund the remaining amount for this borrow request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Request Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Total Amount: {formatAmount(request.amount)} USDC</div>
              <div>
                Already Funded: {formatAmount(request.funded || BigInt(0))} USDC
              </div>
              <div className="font-medium text-foreground">
                Remaining: {formatAmount(remainingAmount)} USDC
              </div>
              <div>
                Borrower: {request.borrower.slice(0, 6)}...
                {request.borrower.slice(-4)}
              </div>
            </div>
          </div>

          {needsApproval ? (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Approval Required:</strong> You need to approve USDC
                spending first, then funding will start automatically
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                This allows the contract to transfer your USDC tokens and create
                the loan
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>You will fund:</strong> {formatAmount(remainingAmount)}{" "}
                USDC
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                This will complete the funding for this request
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {needsApproval ? (
              <Button
                onClick={handleApprove}
                disabled={isApproving || remainingAmount <= 0 || isPending}
                className="flex-1"
              >
                {isApproving || isPending
                  ? "Approving & Funding..."
                  : `Approve & Fund ${formatAmount(remainingAmount)} USDC`}
              </Button>
            ) : (
              <Button
                onClick={handleFund}
                disabled={
                  isFunding ||
                  remainingAmount <= 0 ||
                  isPending ||
                  isContractPending
                }
                className="flex-1"
              >
                {isFunding || isPending || isContractPending
                  ? "Funding..."
                  : `Fund ${formatAmount(remainingAmount)} USDC`}
              </Button>
            )}
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
