"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

// Mock data
const mockRequest = {
  id: "1",
  amount: "15,000",
  tenor: 30,
  grade: "A" as const,
  maxApr: 12,
  fundedPct: 75,
  status: "Pending",
  borrower: "0x1234567890abcdef1234567890abcdef12345678",
  description:
    "Need funds for business expansion and inventory purchase. Established company with 3 years of operations.",
  createdAt: "2024-01-15T10:30:00Z",
  funders: [
    {
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
      amount: "5,000",
      timestamp: "2024-01-15T11:00:00Z",
    },
    {
      address: "0x9876543210fedcba9876543210fedcba98765432",
      amount: "6,250",
      timestamp: "2024-01-15T14:30:00Z",
    },
  ],
  timeline: [
    {
      action: "Request Created",
      timestamp: "2024-01-15T10:30:00Z",
      status: "completed",
    },
    {
      action: "First Funding",
      timestamp: "2024-01-15T11:00:00Z",
      status: "completed",
    },
    {
      action: "Second Funding",
      timestamp: "2024-01-15T14:30:00Z",
      status: "completed",
    },
    { action: "Full Funding", timestamp: null, status: "pending" },
    { action: "Borrower Acceptance", timestamp: null, status: "pending" },
    { action: "Funds Released", timestamp: null, status: "pending" },
  ],
};

export default function RequestDetailPage() {
  const { address, isConnected } = useAccount();
  const params = useParams();
  const requestId = params.id as string;

  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDrawdown, setIsDrawdown] = useState(false);

  const isBorrower =
    address?.toLowerCase() === mockRequest.borrower.toLowerCase();
  const canFund =
    mockRequest.status === "Pending" &&
    mockRequest.fundedPct < 100 &&
    !isBorrower;
  const canAccept = mockRequest.status === "Funded" && isBorrower;
  const canDrawdown = mockRequest.status === "Accepted" && isBorrower;

  const handleFund = async () => {
    if (!fundAmount || isFunding) return;

    setIsFunding(true);
    // Mock contract interaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsFunding(false);
    setFundAmount("");
  };

  const handleAccept = async () => {
    if (isAccepting) return;

    setIsAccepting(true);
    // Mock contract interaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAccepting(false);
  };

  const handleDrawdown = async () => {
    if (isDrawdown) return;

    setIsDrawdown(true);
    // Mock contract interaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDrawdown(false);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Request Details</h1>
          <p className="text-muted-foreground text-lg">
            View detailed information about this loan request
          </p>
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to view request details
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Request #{requestId}</h1>
          <p className="text-muted-foreground">
            {mockRequest.amount} tUSDC • {mockRequest.tenor} days • Grade{" "}
            {mockRequest.grade}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {mockRequest.amount} tUSDC
                  </CardTitle>
                  <CardDescription>
                    Requested by {mockRequest.borrower.slice(0, 6)}...
                    {mockRequest.borrower.slice(-4)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      mockRequest.grade === "A"
                        ? "default"
                        : mockRequest.grade === "B"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    Grade {mockRequest.grade}
                  </Badge>
                  <Badge variant="outline">{mockRequest.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Tenor</div>
                  <div className="text-lg font-semibold">
                    {mockRequest.tenor} days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Max APR</div>
                  <div className="text-lg font-semibold">
                    {mockRequest.maxApr}%
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Funding Progress
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{mockRequest.fundedPct}% funded</span>
                    <span>{mockRequest.amount} tUSDC</span>
                  </div>
                  <Progress value={mockRequest.fundedPct} className="h-2" />
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Description
                </div>
                <p className="text-sm">{mockRequest.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canFund && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <CreditCard className="h-4 w-4" />
                      Fund This Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fund Request</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to contribute to this request
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">
                          Amount (tUSDC)
                        </label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Remaining:{" "}
                        {(parseInt(mockRequest.amount.replace(",", "")) *
                          (100 - mockRequest.fundedPct)) /
                          100}{" "}
                        tUSDC
                      </div>
                      <Button
                        onClick={handleFund}
                        disabled={!fundAmount || isFunding}
                        className="w-full"
                      >
                        {isFunding ? "Processing..." : "Fund Request"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {canAccept && (
                <Button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isAccepting ? "Accepting..." : "Accept Funding"}
                </Button>
              )}

              {canDrawdown && (
                <Button
                  onClick={handleDrawdown}
                  disabled={isDrawdown}
                  className="w-full gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  {isDrawdown ? "Processing..." : "Drawdown Funds"}
                </Button>
              )}

              {!canFund && !canAccept && !canDrawdown && (
                <div className="text-center text-muted-foreground py-4">
                  No actions available at this time
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Funders ({mockRequest.funders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockRequest.funders.map((funder, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {funder.address.slice(0, 6)}...{funder.address.slice(-4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(funder.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {funder.amount} tUSDC
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRequest.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        event.status === "completed"
                          ? "bg-green-500"
                          : event.status === "pending"
                          ? "bg-gray-300"
                          : "bg-gray-200"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{event.action}</div>
                      {event.timestamp && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {event.status === "completed" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
