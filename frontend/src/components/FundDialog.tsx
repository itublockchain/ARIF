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

interface FundDialogProps {
  request: BorrowRequestExtended;
  onFund: (requestId: bigint, amount: bigint) => Promise<void>;
  onApprove: (amount: bigint) => Promise<void>;
  allowance?: bigint;
  isPending?: boolean;
  children: React.ReactNode;
}

export function FundDialog({
  request,
  onFund,
  onApprove,
  allowance,
  isPending,
  children,
}: FundDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
        )} USDC for lending`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to approve USDC";
      setError(errorMessage);
      toast({
        title: "Error",
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

      // Fund the remaining amount automatically
      await onFund(request.id, remainingAmount);

      setIsOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fund request";
      setError(errorMessage);
      toast({
        title: "Error",
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
                spending first
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                This allows the contract to transfer your USDC tokens
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
                  ? "Approving..."
                  : `Approve ${formatAmount(remainingAmount)} USDC`}
              </Button>
            ) : (
              <Button
                onClick={handleFund}
                disabled={isFunding || remainingAmount <= 0 || isPending}
                className="flex-1"
              >
                {isFunding || isPending
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
