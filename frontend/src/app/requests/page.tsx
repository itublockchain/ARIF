"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequestCard } from "@/components/RequestCard";
import { CreditGrade } from "@/lib/types";
import { Search, Filter, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

// Mock data
const mockRequests = [
  {
    id: "1",
    amount: "15,000",
    tenor: 30,
    grade: "A" as CreditGrade,
    maxApr: 12,
    fundedPct: 75,
    status: "Pending",
    borrower: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "2",
    amount: "8,500",
    tenor: 60,
    grade: "B" as CreditGrade,
    maxApr: 16,
    fundedPct: 100,
    status: "Funded",
    borrower: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
  {
    id: "3",
    amount: "25,000",
    tenor: 14,
    grade: "A" as CreditGrade,
    maxApr: 10,
    fundedPct: 40,
    status: "Pending",
    borrower: "0x9876543210fedcba9876543210fedcba98765432",
  },
  {
    id: "4",
    amount: "5,000",
    tenor: 90,
    grade: "C" as CreditGrade,
    maxApr: 25,
    fundedPct: 20,
    status: "Pending",
    borrower: "0xfedcba9876543210fedcba9876543210fedcba98",
  },
  {
    id: "5",
    amount: "12,000",
    tenor: 45,
    grade: "B" as CreditGrade,
    maxApr: 18,
    fundedPct: 100,
    status: "Active",
    borrower: "0x1111222233334444555566667777888899990000",
  },
];

export default function RequestsPage() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [tenorFilter, setTenorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRequests = mockRequests.filter((request) => {
    const matchesSearch =
      request.amount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.borrower.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || request.grade === gradeFilter;
    const matchesTenor =
      tenorFilter === "all" ||
      (tenorFilter === "short" && request.tenor <= 30) ||
      (tenorFilter === "medium" && request.tenor > 30 && request.tenor <= 60) ||
      (tenorFilter === "long" && request.tenor > 60);
    const matchesStatus =
      statusFilter === "all" ||
      request.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesGrade && matchesTenor && matchesStatus;
  });

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Loan Marketplace</h1>
          <p className="text-muted-foreground text-lg">
            Browse and fund loan requests from verified borrowers
          </p>
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to access the marketplace
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and fund loan requests from verified borrowers
          </p>
        </div>
        <Link href="/borrow/new">
          <Button className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Create Request
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{mockRequests.length}</div>
            <div className="text-sm text-muted-foreground">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {mockRequests.filter((r) => r.status === "Pending").length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {mockRequests.filter((r) => r.status === "Active").length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {mockRequests.reduce((sum, r) => sum + r.fundedPct, 0) /
                mockRequests.length}
              %
            </div>
            <div className="text-sm text-muted-foreground">Avg. Funded</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Grade</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="A">Grade A</SelectItem>
                  <SelectItem value="B">Grade B</SelectItem>
                  <SelectItem value="C">Grade C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tenor</label>
              <Select value={tenorFilter} onValueChange={setTenorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All tenors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenors</SelectItem>
                  <SelectItem value="short">Short (≤30 days)</SelectItem>
                  <SelectItem value="medium">Medium (31-60 days)</SelectItem>
                  <SelectItem value="long">Long (&gt;60 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredRequests.length} Request
            {filteredRequests.length !== 1 ? "s" : ""} Found
          </h2>
          <div className="flex gap-2">
            <Badge variant="outline">
              {mockRequests.filter((r) => r.grade === "A").length} Grade A
            </Badge>
            <Badge variant="outline">
              {mockRequests.filter((r) => r.grade === "B").length} Grade B
            </Badge>
            <Badge variant="outline">
              {mockRequests.filter((r) => r.grade === "C").length} Grade C
            </Badge>
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No requests found</h3>
                <p>Try adjusting your filters or search terms</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
