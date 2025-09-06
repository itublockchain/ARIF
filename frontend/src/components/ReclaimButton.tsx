"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, QrCode, CheckCircle, AlertCircle } from "lucide-react";

interface ReclaimButtonProps {
  onSuccess?: (proof: any) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
}

export function ReclaimButton({
  onSuccess,
  onError,
  className,
  size = "default",
  variant = "default",
}: ReclaimButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"start" | "qr" | "success" | "error">(
    "start"
  );
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock Reclaim session creation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep("qr");
    } catch (err) {
      setError("Failed to start Reclaim session");
      setStep("error");
      onError?.(err as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRComplete = async () => {
    setIsLoading(true);

    try {
      // Mock proof generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStep("success");
      onSuccess?.({ proofHash: "0x123...", timestamp: Date.now() });
    } catch (err) {
      setError("Failed to generate proof");
      setStep("error");
      onError?.(err as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("start");
    setError(null);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={className}
        size={size}
        variant={variant}
        disabled={isLoading}
      >
        <Shield className="h-4 w-4 mr-2" />
        {isLoading ? "Starting..." : "Verify with Reclaim"}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reclaim Verification</DialogTitle>
            <DialogDescription>
              Prove your financial data without revealing it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {step === "start" && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Reclaim Protocol allows you to prove your income and balance
                    from your bank account without revealing the actual amounts.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">What you'll prove:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Income is above a certain threshold</li>
                    <li>• Account balance is above a certain amount</li>
                    <li>• Account is active and in good standing</li>
                  </ul>
                </div>

                <Button
                  onClick={handleStart}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Session..." : "Start Verification"}
                </Button>
              </div>
            )}

            {step === "qr" && (
              <div className="space-y-4 text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Scan QR Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Use your mobile device to scan the QR code and connect your
                    bank account
                  </p>
                </div>

                <Button
                  onClick={handleQRComplete}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Generating Proof..."
                    : "I've Connected My Account"}
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">
                    Verification Successful!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Your financial data has been verified and a proof has been
                    generated.
                  </p>
                </div>

                <Button onClick={handleClose} className="w-full">
                  Continue
                </Button>
              </div>
            )}

            {step === "error" && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">
                    Verification Failed
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {error || "Something went wrong during verification"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button onClick={() => setStep("start")} className="flex-1">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
