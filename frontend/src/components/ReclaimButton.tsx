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
import { Shield, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface ReclaimButtonProps {
  onSuccess?: (proof: any) => void;
  onError?: (error: string) => void;
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
  const [proof, setProof] = useState<{
    proofHash: string;
    timestamp: number;
    isValid: boolean;
  } | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock Reclaim process - in real implementation, this would:
      // 1. Create a Reclaim session
      // 2. Generate QR code for user to scan
      // 3. Wait for proof verification

      setStep("qr");

      // Simulate QR code generation and proof verification
      setTimeout(() => {
        setStep("success");
        setProof({
          proofHash: "0x" + Math.random().toString(16).substr(2, 64),
          timestamp: Math.floor(Date.now() / 1000),
          isValid: true,
          data: "mock-proof-data",
        });
        onSuccess?.(proof);
        setIsLoading(false);
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start verification"
      );
      setStep("error");
      onError?.(error || "Unknown error");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("start");
    setError(null);
    setProof(null);
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
                  <h4 className="font-medium">What you&apos;ll prove:</h4>
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
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-black rounded-lg mb-2"></div>
                    <p className="text-sm text-muted-foreground">QR Code</p>
                  </div>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Scan the QR code with your phone to connect your bank
                    account and prove your financial status.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  <p>Waiting for verification...</p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold">
                    Verification Complete!
                  </h3>
                  <p className="text-muted-foreground">
                    Your financial proof has been verified successfully.
                  </p>
                </div>

                {proof && (
                  <div className="bg-muted p-3 rounded-lg text-left">
                    <h4 className="font-medium mb-2">Proof Details:</h4>
                    <div className="text-sm space-y-1">
                      <div>Hash: {proof.proofHash.slice(0, 20)}...</div>
                      <div>
                        Timestamp:{" "}
                        {new Date(proof.timestamp * 1000).toLocaleString()}
                      </div>
                      <div>Status: {proof.isValid ? "Valid" : "Invalid"}</div>
                    </div>
                  </div>
                )}

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

                <div>
                  <h3 className="text-lg font-semibold">Verification Failed</h3>
                  <p className="text-muted-foreground">
                    {error || "An error occurred during verification."}
                  </p>
                </div>

                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
