"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { CreditGrade } from "@/lib/types";

interface AttestationBadgeProps {
  type: "kyc" | "credit";
  status: "verified" | "pending" | "failed";
  grade?: CreditGrade;
  className?: string;
}

export function AttestationBadge({
  type,
  status,
  grade,
  className,
}: AttestationBadgeProps) {
  const getIcon = () => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (status) {
      case "verified":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "failed":
        return "destructive" as const;
    }
  };

  const getText = () => {
    if (type === "kyc") {
      switch (status) {
        case "verified":
          return "KYC Verified";
        case "pending":
          return "KYC Pending";
        case "failed":
          return "KYC Failed";
      }
    } else {
      switch (status) {
        case "verified":
          return `Grade ${grade}`;
        case "pending":
          return "Grade Pending";
        case "failed":
          return "Grade Failed";
      }
    }
  };

  return (
    <Badge variant={getVariant()} className={`gap-1 ${className}`}>
      {getIcon()}
      {getText()}
    </Badge>
  );
}
