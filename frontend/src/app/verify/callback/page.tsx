"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type KYCStatus = "loading" | "success" | "failed" | "pending" | "error";

export default function VerifyCallbackPage() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { updateKYCStatus } = useKYCStatus();
  const [status, setStatus] = useState<KYCStatus>("loading");
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const inquiryIdParam = searchParams.get("inquiry-id");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setStatus("error");
      return;
    }

    if (inquiryIdParam) {
      setInquiryId(inquiryIdParam);
      // Check KYC status with Persona API
      checkKYCStatus(inquiryIdParam);
    } else {
      setError("No inquiry ID provided");
      setStatus("error");
    }
  }, [searchParams, isClient]);

  const checkKYCStatus = async (inquiryId: string, retryCount = 0) => {
    try {
      setStatus("loading");
      setProgress(25);

      // Call our KYC status API
      const response = await fetch(`/api/kyc/status?inquiryId=${inquiryId}`, {
        cache: "no-store",
      });
      setProgress(50);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check KYC status");
      }

      setProgress(75);
      const { ui: personaUI, status: personaStatus, decision, outcome } = data;

      console.log("Persona status check:", {
        personaUI,
        personaStatus,
        decision,
        outcome,
      });

      if (personaUI === "APPROVED") {
        setStatus("success");
        setProgress(100);

        // Create EAS attestation
        try {
          const attestResponse = await fetch("/api/kyc/attest", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inquiryId,
              walletAddress: address,
            }),
          });

          if (attestResponse.ok) {
            const attestData = await attestResponse.json();
            console.log("KYC attestation created:", attestData.attestationUID);
          } else {
            console.error("Failed to create KYC attestation");
          }
        } catch (attestError) {
          console.error("Error creating KYC attestation:", attestError);
        }

        // Update KYC status in the hook
        updateKYCStatus(true, inquiryId);
      } else if (personaUI === "DECLINED") {
        setStatus("failed");
        setProgress(100);
        updateKYCStatus(false);
      } else if (personaUI === "PENDING") {
        setStatus("pending");
        setProgress(50);

        // Retry logic: check again after 5 seconds, max 12 times (60 seconds total)
        if (retryCount < 12) {
          setTimeout(() => {
            checkKYCStatus(inquiryId, retryCount + 1);
          }, 5000);
        } else {
          setError(
            "Verification is taking longer than expected. Please try again later."
          );
          setStatus("error");
          setProgress(100);
        }
      } else if (personaUI === "ERROR") {
        setError("Failed to verify KYC status");
        setStatus("error");
        setProgress(100);
      } else {
        setError("Unknown KYC status received");
        setStatus("error");
        setProgress(100);
      }
    } catch (err) {
      console.error("Error checking KYC status:", err);
      setError("Failed to verify KYC status");
      setStatus("error");
      setProgress(100);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case "failed":
        return <XCircle className="h-8 w-8 text-red-600" />;
      case "pending":
        return <Clock className="h-8 w-8 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "loading":
        return "Verifying your KYC status...";
      case "success":
        return "KYC verification completed successfully!";
      case "failed":
        return "KYC verification failed. Please try again.";
      case "pending":
        return "Your KYC verification is under review.";
      case "error":
        return "An error occurred during verification.";
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!isClient) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          {getStatusIcon()}
        </div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground text-lg">{getStatusMessage()}</p>
        {getStatusBadge()}

        {(status === "loading" || status === "pending") && (
          <div className="w-full max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Verification Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Details</CardTitle>
          <CardDescription>
            Information about your KYC verification process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inquiryId && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Inquiry ID:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {inquiryId}
              </code>
            </div>
          )}

          {address && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Wallet Address:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {address.slice(0, 6)}...{address.slice(-4)}
              </code>
            </div>
          )}

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your identity has been successfully verified. You can now
                proceed to create borrow requests.
              </AlertDescription>
            </Alert>
          )}

          {status === "failed" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your KYC verification failed. Please ensure all information is
                correct and try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        {status === "success" ? (
          <>
            <Link href="/borrow/new">
              <Button size="lg" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Create Borrow Request
              </Button>
            </Link>
            <Link href="/requests">
              <Button variant="outline" size="lg">
                Browse Marketplace
              </Button>
            </Link>
          </>
        ) : status === "failed" ? (
          <Link href="/verify">
            <Button size="lg" className="gap-2">
              <XCircle className="h-4 w-4" />
              Try Again
            </Button>
          </Link>
        ) : (
          <Link href="/">
            <Button variant="outline" size="lg">
              Back to Home
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
