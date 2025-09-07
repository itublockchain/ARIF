"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  CreditCard,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { Leaderboard } from "@/components/Leaderboard";

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('/logo.svg')] bg-no-repeat bg-center bg-cover opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Image
                  src="/logo.svg"
                  alt="ARIF Logo"
                  width={120}
                  height={120}
                  className="drop-shadow-2xl"
                />
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-blue-400 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                ARIF
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                A fully on-chain, locally compliant peer-to-peer lending
                platform where users can provide credit directly to each other
              </p>
              <p className="text-lg text-blue-200 max-w-3xl mx-auto">
                Bridging the gap between traditional finance&apos;s high costs and
                DeFi&apos;s regulatory challenges; offering a reliable, transparent,
                and sustainable alternative.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                onClick={handleBorrowerClick}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Borrow
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                onClick={handleLenderClick}
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Invest
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Why ARIF?
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
              Secure, transparent, and efficient credit solutions powered by
              blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Secure & Transparent
                </h3>
                <p className="text-slate-700 dark:text-slate-300">
                  All transactions are recorded on blockchain, privacy protected
                  with ZK proofs
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Fast & Low Cost
                </h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Instant transactions on RISE L2, much lower fees than
                  traditional banking
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Peer-to-Peer
                </h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Intermediary-free, direct credit exchange between users
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              How It Works?
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300">
              Borrow or invest with simple and secure steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Borrower Flow */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
                For Borrowers
              </h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      KYC Verification
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Complete identity verification and get credit score
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Income Proof
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Create income and balance proof with Reclaim
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Create Request
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Set amount, term, and interest rate
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Get Funded & Repay
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Receive funding from investors and repay at maturity
                    </p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
                onClick={handleBorrowerClick}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Start Borrowing
              </Button>
            </div>

            {/* Lender Flow */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
                For Investors
              </h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Connect Wallet
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Connect your Web3 wallet
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Review Requests
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Evaluate requests with credit score and risk profile
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Invest
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Fund requests partially or fully that you like
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Earn Interest
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Get back principal + interest at maturity
                    </p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
                onClick={handleLenderClick}
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Start Investing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-white">
              Platform Statistics
            </h2>
            <p className="text-xl text-slate-300">
              A trusted and growing community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-blue-400">$2.5M+</div>
              <div className="text-slate-300">Total Volume</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-green-400">1,200+</div>
              <div className="text-slate-300">Active Users</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-purple-400">98.5%</div>
              <div className="text-slate-300">Success Rate</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-yellow-400">24/7</div>
              <div className="text-slate-300">Always Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              USDC Minting Leaderboard
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300">
              Top minters on RISE L2 network
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Leaderboard />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white">Get Started Now</h2>
            <p className="text-xl text-blue-100">
              Take your place in the future of Web3. Secure, transparent, and
              efficient credit solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl"
                onClick={handleBorrowerClick}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Borrow
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl"
                onClick={handleLenderClick}
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Invest
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
