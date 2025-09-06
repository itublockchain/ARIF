"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard } from "lucide-react";

export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleLenderClick = () => {
    if (isConnected) {
      router.push("/lender");
    } else {
      // Show wallet connection message
      alert("Please connect your wallet first");
    }
  };

  const handleBorrowerClick = () => {
    if (isConnected) {
      router.push("/borrower");
    } else {
      // Show wallet connection message
      alert("Please connect your wallet first");
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Ikisini de dene, tarafini sec.</h1>
        <p className="text-muted-foreground text-lg">
          Try both, choose your side.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Lender Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={handleLenderClick}
        >
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">I am a Lender</h2>
              <p className="text-muted-foreground">
                Fund loan requests and earn interest
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLenderClick();
                }}
              >
                Start Lending
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Borrower Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={handleBorrowerClick}
        >
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">I am a Borrower</h2>
              <p className="text-muted-foreground">
                Create loan requests and get funded
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBorrowerClick();
                }}
              >
                Start Borrowing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
