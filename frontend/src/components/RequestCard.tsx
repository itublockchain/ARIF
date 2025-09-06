"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditGrade } from "@/lib/types";
import Link from "next/link";

interface RequestCardProps {
  request: {
    id: string;
    amount: string;
    tenor: number;
    grade: CreditGrade;
    maxApr: number;
    fundedPct: number;
    status: string;
    borrower: string;
  };
}

export function RequestCard({ request }: RequestCardProps) {
  const getGradeVariant = (grade: CreditGrade) => {
    switch (grade) {
      case "A":
        return "default";
      case "B":
        return "secondary";
      case "C":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600";
      case "Pending":
        return "text-yellow-600";
      case "Funded":
        return "text-blue-600";
      case "Repaid":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className="hover:shadow-sm transition-all duration-200">
      <CardHeader className="flex items-center justify-between">
        <div className="text-lg font-semibold">{request.amount} tUSDC</div>
        <div className="flex gap-2">
          <Badge variant={getGradeVariant(request.grade)}>
            Grade {request.grade}
          </Badge>
          <Badge variant="outline" className={getStatusColor(request.status)}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Tenor: {request.tenor} days · Max APR: {request.maxApr}%
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Funding Progress</span>
            <span>{request.fundedPct}%</span>
          </div>
          <Progress value={request.fundedPct} className="h-2" />
        </div>
        <div className="text-xs text-muted-foreground">
          Borrower: {request.borrower.slice(0, 6)}...
          {request.borrower.slice(-4)}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-sm text-muted-foreground">
          {request.fundedPct}% funded
        </span>
        <div className="flex gap-2">
          <Link href={`/request/${request.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          {request.status === "Pending" && request.fundedPct < 100 && (
            <Button size="sm">Fund</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
