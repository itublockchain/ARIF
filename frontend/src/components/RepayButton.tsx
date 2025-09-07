"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle, DollarSign } from "lucide-react";
import { contractService } from "@/lib/contract-service";
import { useToast } from "@/hooks/use-toast";
import { useContractActions } from "@/hooks/use-contract-actions";
import { formatUnits } from "viem";

interface RepayButtonProps {
  borrowID: bigint;
  amount: bigint;
  deadline: bigint;
  overtimeInterest: bigint;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function RepayButton({
  borrowID,
  amount,
  deadline,
  overtimeInterest,
  className,
  size = "default",
  variant = "default",
}: RepayButtonProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const { repayLoan, isPending } = useContractActions();
  const [isOpen, setIsOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState<bigint | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [overdueDays, setOverdueDays] = useState(0);

  const handleOpen = async () => {
    setIsOpen(true);

    // Calculate repayment amount and overdue status
    const now = Math.floor(Date.now() / 1000);
    const overdue = now - Number(deadline);
    setIsOverdue(overdue > 0);
    setOverdueDays(Math.max(0, overdue));

    try {
      const repayAmount = await contractService.getRepaymentAmount(borrowID);
      setRepaymentAmount(repayAmount);
    } catch (error) {
      console.error("Error calculating repayment amount:", error);
      toast({
        title: "Error",
        description: "Failed to calculate repayment amount",
        variant: "destructive",
      });
    }
  };

  const handleRepay = async () => {
    if (!address || !repaymentAmount) return;

    try {
      await repayLoan(borrowID);
      setIsOpen(false);
    } catch (error) {
      console.error("Error repaying loan:", error);
      // Error handling is done in the hook
    }
  };

  const getInterestMultiplier = () => {
    if (overdueDays >= 9) return 2.5;
    if (overdueDays >= 6) return 2;
    if (overdueDays >= 3) return 1.5;
    return 1;
  };

  const getInterestColor = () => {
    if (overdueDays >= 9) return "destructive";
    if (overdueDays >= 6) return "destructive";
    if (overdueDays >= 3) return "secondary";
    return "default";
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className={className}
        size={size}
        variant={variant}
        disabled={isPending}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isPending ? "Repaying..." : "Repay Loan"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Repay Loan</DialogTitle>
            <DialogDescription>
              Review and confirm your loan repayment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Loan Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Loan ID:</span>
                <span className="font-medium">#{borrowID.toString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Principal:
                </span>
                <span className="font-medium">
                  {formatUnits(amount, 6)} USDC
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Due Date:</span>
                <span className="font-medium">
                  {new Date(Number(deadline) * 1000).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={isOverdue ? "destructive" : "default"}>
                  {isOverdue ? `Overdue (${overdueDays} days)` : "On Time"}
                </Badge>
              </div>
            </div>

            {/* Interest Calculation */}
            {isOverdue && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This loan is overdue. Additional interest will be applied
                  based on the delay.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Interest Calculation:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Base Interest Rate:</span>
                  <span>{Number(overtimeInterest) / 100}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Multiplier:</span>
                  <Badge variant={getInterestColor()}>
                    {getInterestMultiplier()}x
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Effective Rate:</span>
                  <span className="font-medium">
                    {(Number(overtimeInterest) * getInterestMultiplier()) / 100}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Repayment Amount */}
            {repaymentAmount && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    Total Repayment:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatUnits(repaymentAmount, 6)} USDC
                  </span>
                </div>
              </div>
            )}

            {/* Warning for high interest */}
            {isOverdue && overdueDays >= 9 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Warning: This loan is severely overdue. The interest rate has
                  been increased significantly.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleRepay}
                className="flex-1"
                disabled={isPending || !repaymentAmount}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {isPending ? "Processing..." : "Confirm Repayment"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
