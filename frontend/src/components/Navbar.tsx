"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreditCard, DollarSign } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1 bg-muted/50 p-1 rounded-lg">
            <Link
              href="/lender"
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                pathname === "/lender"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <DollarSign className="h-4 w-4" />
              Lender
            </Link>
            <Link
              href="/borrower"
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                pathname === "/borrower"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Borrower
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center">
            <ConnectButton
              chainStatus="icon"
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
