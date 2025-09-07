"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { useRiskScore } from "@/hooks/use-risk-score";

export function RiskScoreCard() {
  const {
    riskData,
    isLoading,
    error,
    refreshRiskScore,
    getRiskColor,
    getRiskIcon,
    getCreditGrade,
  } = useRiskScore();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Analyzing wallet behavior...</p>
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
            <Shield className="h-5 w-5" />
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to analyze risk: {error}</AlertDescription>
          </Alert>
          <Button
            onClick={refreshRiskScore}
            variant="outline"
            className="mt-4 w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!riskData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-2">No risk data available</p>
            <p className="text-sm text-slate-500">
              Connect your wallet to get AI-powered risk assessment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const creditGrade = getCreditGrade(riskData.riskScore);

  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-900 border-slate-700 overflow-hidden">
      <CardHeader className="pb-4 px-4 sm:px-6">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="text-lg font-semibold">AI Risk Assessment</span>
          </div>
          <Button
            onClick={refreshRiskScore}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 px-4 sm:px-6">
        {/* Risk Score Display */}
        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">
                {getRiskIcon(riskData.riskLevel)}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-4xl font-bold text-white mb-2">
                {riskData.riskScore}/100
              </div>
              <Badge
                className={`${getRiskColor(
                  riskData.riskLevel
                )} font-semibold text-sm px-3 py-1`}
              >
                {riskData.riskLevel} RISK
              </Badge>
            </div>
          </div>

          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-slate-300">
              <span className="font-medium">Risk Score</span>
              <span className="font-semibold">{riskData.riskScore}/100</span>
            </div>
            <Progress value={riskData.riskScore} className="h-3 bg-slate-700" />
          </div>
        </div>

        {/* Credit Grade */}
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-3 font-medium">
            Credit Grade
          </div>
          <Badge
            variant={
              creditGrade === "A"
                ? "default"
                : creditGrade === "B"
                ? "secondary"
                : "destructive"
            }
            className="text-xl px-6 py-3 font-bold"
          >
            Grade {creditGrade}
          </Badge>
        </div>

        {/* Risk Factors */}
        <div className="space-y-6">
          <h4 className="font-semibold text-lg text-white">Risk Factors</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 min-h-[120px]">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Activity className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="font-medium">Minting Activity</span>
              </div>
              <Progress
                value={riskData.factors.mintingActivity}
                className="h-2 bg-slate-700"
              />
              <div className="text-sm text-slate-400 font-medium">
                {riskData.factors.mintingActivity}/100
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 min-h-[120px]">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Users className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="font-medium">Leaderboard Rank</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {riskData.factors.leaderboardRank === 999
                  ? "#0"
                  : `#${riskData.factors.leaderboardRank}`}
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 min-h-[120px]">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <TrendingUp className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <span className="font-medium">Consistency</span>
              </div>
              <Progress
                value={riskData.factors.consistency}
                className="h-2 bg-slate-700"
              />
              <div className="text-sm text-slate-400 font-medium">
                {riskData.factors.consistency}/100
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 min-h-[120px]">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Shield className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <span className="font-medium">Volume</span>
              </div>
              <Progress
                value={riskData.factors.volume}
                className="h-2 bg-slate-700"
              />
              <div className="text-sm text-slate-400 font-medium">
                {riskData.factors.volume}/100
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <Alert className="bg-slate-800/50 border-slate-600">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
          <AlertDescription className="text-slate-300 text-sm leading-relaxed break-anywhere">
            {riskData.explanation}
          </AlertDescription>
        </Alert>

        {/* Recommendations */}
        {riskData.recommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-white">
              AI Recommendations
            </h4>
            <div className="space-y-3">
              {riskData.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-800/30"
                >
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 leading-relaxed break-anywhere">
                    {recommendation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
