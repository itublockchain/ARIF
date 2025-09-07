"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Users, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalMinted: string;
}

interface LeaderboardData {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  totalEvents: number;
  blockRange: {
    from: number;
    to: number;
  };
  chain: string;
  token: string;
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leaderboard');
        const result = await response.json();
        
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || 'Failed to fetch leaderboard');
        }
      } catch (err) {
        setError('Failed to fetch leaderboard data');
        console.error('Leaderboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-slate-500">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default" as const;
      case 2:
        return "secondary" as const;
      case 3:
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            USDC Minting Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            USDC Minting Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error loading leaderboard</p>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          USDC Minting Leaderboard
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {data?.leaderboard.length || 0} addresses
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {data?.totalEvents || 0} mint events
          </div>
          <Badge variant="outline" className="text-xs">
            {data?.chain || 'RISE L2'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data?.leaderboard && data.leaderboard.length > 0 ? (
          <div className="space-y-3">
            {data.leaderboard.map((entry) => (
              <div
                key={entry.address}
                className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-medium">
                      {formatAddress(entry.address)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Highest single mint
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getRankBadgeVariant(entry.rank)} className="mb-1">
                    {entry.totalMinted} USDC
                  </Badge>
                  <div className="text-xs text-slate-500">
                    Rank #{entry.rank}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-2">No minting activity found</p>
            <p className="text-sm text-slate-500">
              Mint some USDC to appear on the leaderboard
            </p>
          </div>
        )}
        
        {data?.blockRange && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 text-center">
              Data from blocks {data.blockRange.from.toLocaleString()} to {data.blockRange.to.toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
