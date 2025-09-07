"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface RiskScoreData {
  walletAddress: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  factors: {
    mintingActivity: number;
    leaderboardRank: number;
    consistency: number;
    volume: number;
  };
  explanation: string;
  recommendations: string[];
}

interface RiskScoreResponse {
  success: boolean;
  data: RiskScoreData;
}

export function useRiskScore() {
  const { address } = useAccount();
  const [riskData, setRiskData] = useState<RiskScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskScore = async (walletAddress?: string) => {
    const targetAddress = walletAddress || address;
    if (!targetAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      // First, get leaderboard data
      const leaderboardResponse = await fetch("/api/leaderboard");
      const leaderboardData = await leaderboardResponse.json();

      console.log("🔍 Hook - Leaderboard Data:", leaderboardData);

      if (!leaderboardData.success) {
        throw new Error("Failed to fetch leaderboard data");
      }

      // Then, get risk score based on leaderboard data
      const requestBody = {
        walletAddress: targetAddress,
        leaderboardData: leaderboardData.leaderboard,
      };

      console.log("🔍 Hook - Request Body:", requestBody);

      const riskResponse = await fetch("/api/risk-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const riskResult: RiskScoreResponse = await riskResponse.json();

      if (riskResult.success) {
        setRiskData(riskResult.data);
      } else {
        throw new Error(riskResult.error || "Failed to generate risk score");
      }
    } catch (err) {
      console.error("Error fetching risk score:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch risk score"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRiskScore = () => {
    if (address) {
      fetchRiskScore();
    }
  };

  useEffect(() => {
    if (address) {
      fetchRiskScore();
    }
  }, [address]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "text-green-600 bg-green-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "HIGH":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getCreditGrade = (riskScore: number): "A" | "B" | "C" => {
    if (riskScore <= 30) return "A";
    if (riskScore <= 70) return "B";
    return "C";
  };

  return {
    riskData,
    isLoading,
    error,
    fetchRiskScore,
    refreshRiskScore,
    getRiskColor,
    getRiskIcon,
    getCreditGrade,
  };
}
