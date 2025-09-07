"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreditCard, DollarSign, Home, Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <Image
                src="/logo.svg"
                alt="ARIF Logo"
                width={40}
                height={40}
                className="drop-shadow-lg"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-slate-100">ARIF</h1>
              <p className="text-xs text-slate-400 -mt-1">
                P2P Credit Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-800/50 p-1 rounded-xl">
            <Link
              href="/"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                pathname === "/"
                  ? "bg-slate-700 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
              )}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/lender"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                pathname === "/lender"
                  ? "bg-slate-700 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
              )}
            >
              <DollarSign className="h-4 w-4" />
              Investor
            </Link>
            <Link
              href="/borrower"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                pathname === "/borrower"
                  ? "bg-slate-700 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Borrower
            </Link>
          </div>

          {/* Desktop Wallet Connection */}
          <div className="hidden md:flex items-center">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus="avatar"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700 bg-slate-900/95 backdrop-blur">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  pathname === "/"
                    ? "bg-blue-900/50 text-blue-300"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </div>
              </Link>
              <Link
                href="/lender"
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  pathname === "/lender"
                    ? "bg-blue-900/50 text-blue-300"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Investor
                </div>
              </Link>
              <Link
                href="/borrower"
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  pathname === "/borrower"
                    ? "bg-blue-900/50 text-blue-300"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Borrower
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
