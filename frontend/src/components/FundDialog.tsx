"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { parseUnits } from "viem";
import { BorrowRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface FundDialogProps {
  request: BorrowRequest;
  onFund: (requestId: bigint, amount: bigint) => Promise<void>;
  children: React.ReactNode;
}

export function FundDialog({ request, onFund, children }: FundDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const remainingAmount = request.amount - request.funded;
  const maxAmount = remainingAmount;

  const handleFund = async () => {
    if (!amount || isFunding) return;

    try {
      setError(null);
      setIsFunding(true);

      // Parse amount to raw units (assuming 6 decimals for USDC)
      const amountRaw = parseUnits(amount, 6);

      if (amountRaw > maxAmount) {
        setError("Amount exceeds remaining funding needed");
        setIsFunding(false);
        return;
      }

      if (amountRaw <= 0n) {
        setError("Amount must be greater than 0");
        setIsFunding(false);
        return;
      }

      await onFund(request.id, amountRaw);

      toast({
        title: "Success!",
        description: `Successfully funded ${amount} USDC`,
      });

      setIsOpen(false);
      setAmount("");
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
            Contribute to this borrow request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Request Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Amount: {formatAmount(request.amount)} USDC</div>
              <div>Funded: {formatAmount(request.funded)} USDC</div>
              <div>Remaining: {formatAmount(remainingAmount)} USDC</div>
              <div>
                Borrower: {request.borrower.slice(0, 6)}...
                {request.borrower.slice(-4)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to Fund (USDC)</label>
            <Input
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={Number(formatAmount(maxAmount))}
            />
            <div className="text-xs text-muted-foreground">
              Maximum: {formatAmount(maxAmount)} USDC
            </div>
          </div>

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleFund}
              disabled={!amount || isFunding}
              className="flex-1"
            >
              {isFunding ? "Funding..." : "Fund Request"}
            </Button>
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
