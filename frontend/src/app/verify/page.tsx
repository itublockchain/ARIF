"use client";

import { useState, useEffect } from "react";
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
import {
  CheckCircle,
  // XCircle,
  AlertCircle,
  Shield,
  CreditCard,
  Zap,
} from "lucide-react";
import Link from "next/link";

type VerificationStep = "kyc" | "reclaim" | "credit" | "complete";

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const {
    isVerified: kycCompleted,
    isLoading: kycLoading,
    // updateKYCStatus,
  } = useKYCStatus();
  const [currentStep, setCurrentStep] = useState<VerificationStep>("kyc");
  const [reclaimCompleted, setReclaimCompleted] = useState(false);
  const [creditGrade, setCreditGrade] = useState<"A" | "B" | "C" | null>(null);

  const steps = [
    {
      id: "kyc" as const,
      title: "KYC Verification",
      description: "Verify your identity with our KYC provider",
      icon: Shield,
      completed: kycCompleted,
    },
    {
      id: "reclaim" as const,
      title: "Financial Proof",
      description: "Prove your income and balance using Reclaim Protocol",
      icon: CreditCard,
      completed: reclaimCompleted,
    },
    {
      id: "credit" as const,
      title: "Credit Scoring",
      description: "Get your AI-powered credit grade (A/B/C)",
      icon: Zap,
      completed: creditGrade !== null,
    },
  ];

  // Update current step based on completion status
  useEffect(() => {
    if (kycCompleted && !reclaimCompleted) {
      setCurrentStep("reclaim");
    } else if (kycCompleted && reclaimCompleted && !creditGrade) {
      setCurrentStep("credit");
    } else if (kycCompleted && reclaimCompleted && creditGrade) {
      setCurrentStep("complete");
    }
  }, [kycCompleted, reclaimCompleted, creditGrade]);

  const handleKYC = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      // Start Persona KYC process
      const response = await fetch(`/api/kyc/start?address=${address}`);
      const data = await response.json();

      if (data.url) {
        // Redirect to Persona hosted flow
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to start KYC process");
      }
    } catch (error) {
      console.error("Error starting KYC:", error);
      alert("Failed to start KYC process. Please try again.");
    }
  };

  const handleReclaim = () => {
    // Mock Reclaim process
    setTimeout(() => {
      setReclaimCompleted(true);
      setCurrentStep("credit");
    }, 3000);
  };

  const handleCreditScoring = () => {
    // Mock AI credit scoring
    setTimeout(() => {
      setCreditGrade("B");
      setCurrentStep("complete");
    }, 2000);
  };

  const isStepActive = (stepId: VerificationStep) => {
    return currentStep === stepId;
  };

  const isStepCompleted = (stepId: VerificationStep) => {
    return steps.find((s) => s.id === stepId)?.completed || false;
  };

  const canProceedToStep = (stepId: VerificationStep) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex === 0) return true;
    return steps[stepIndex - 1].completed;
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Identity & Proof Verification</h1>
          <p className="text-muted-foreground text-lg">
            Complete your verification to access the platform
          </p>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to start the verification process
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Identity & Proof Verification</h1>
        <p className="text-muted-foreground text-lg">
          Complete these steps to access the full platform features
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = isStepActive(step.id);
          const isCompleted = isStepCompleted(step.id);
          const canProceed = canProceedToStep(step.id);

          return (
            <div
              key={step.id}
              className="flex flex-col items-center space-y-2 flex-1"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  isCompleted
                    ? "bg-green-100 border-green-500 text-green-600"
                    : isActive
                    ? "bg-blue-100 border-blue-500 text-blue-600"
                    : canProceed
                    ? "bg-gray-100 border-gray-300 text-gray-600"
                    : "bg-gray-50 border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <div className="text-center">
                <div
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground max-w-24">
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-full h-0.5 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const currentStepData = steps.find((s) => s.id === currentStep);
              const Icon = currentStepData?.icon;
              return Icon ? <Icon className="h-5 w-5" /> : null;
            })()}
            {steps.find((s) => s.id === currentStep)?.title}
          </CardTitle>
          <CardDescription>
            {steps.find((s) => s.id === currentStep)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === "kyc" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  KYC verification ensures compliance and builds trust in the
                  platform. Your personal information is encrypted and never
                  stored on-chain.
                </AlertDescription>
              </Alert>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Click below to start the KYC verification process
                </p>
                <Button
                  onClick={handleKYC}
                  size="lg"
                  className="gap-2"
                  disabled={kycLoading}
                >
                  <Shield className="h-4 w-4" />
                  {kycLoading ? "Starting KYC..." : "Start KYC Verification"}
                </Button>
              </div>
            </div>
          )}

          {currentStep === "reclaim" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Reclaim Protocol allows you to prove your financial data
                  without revealing it. You&apos;ll need to connect your bank account
                  and prove income/balance thresholds.
                </AlertDescription>
              </Alert>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Connect your bank account and prove your financial status
                </p>
                <Button onClick={handleReclaim} size="lg" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Start Reclaim Process
                </Button>
              </div>
            </div>
          )}

          {currentStep === "credit" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Our AI analyzes your financial profile to assign a credit
                  grade. This determines your borrowing limits and interest
                  rates.
                </AlertDescription>
              </Alert>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Generate your AI-powered credit score
                </p>
                <Button
                  onClick={handleCreditScoring}
                  size="lg"
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Generate Credit Score
                </Button>
              </div>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  Verification Complete!
                </h3>
                <p className="text-muted-foreground">
                  You&apos;re now ready to use the platform
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  KYC Verified
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Financial Proof
                </Badge>
                <Badge
                  variant={
                    creditGrade === "A"
                      ? "default"
                      : creditGrade === "B"
                      ? "secondary"
                      : "destructive"
                  }
                  className="gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Grade {creditGrade}
                </Badge>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/borrow/new">
                  <Button size="lg" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Create Request
                  </Button>
                </Link>
                <Link href="/requests">
                  <Button variant="outline" size="lg" className="gap-2">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
