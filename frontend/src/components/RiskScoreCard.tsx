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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Risk Assessment
          </div>
          <Button
            onClick={refreshRiskScore}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Score Display */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">{getRiskIcon(riskData.riskLevel)}</span>
            <div>
              <div className="text-3xl font-bold">{riskData.riskScore}/100</div>
              <Badge
                className={`${getRiskColor(riskData.riskLevel)} font-semibold`}
              >
                {riskData.riskLevel} RISK
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Risk Score</span>
              <span>{riskData.riskScore}/100</span>
            </div>
            <Progress value={riskData.riskScore} className="h-2" />
          </div>
        </div>

        {/* Credit Grade */}
        <div className="text-center">
          <div className="text-sm text-slate-600 mb-2">Credit Grade</div>
          <Badge
            variant={
              creditGrade === "A"
                ? "default"
                : creditGrade === "B"
                ? "secondary"
                : "destructive"
            }
            className="text-lg px-4 py-2"
          >
            Grade {creditGrade}
          </Badge>
        </div>

        {/* Risk Factors */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Risk Factors</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                <span>Minting Activity</span>
              </div>
              <Progress
                value={riskData.factors.mintingActivity}
                className="h-1"
              />
              <div className="text-xs text-slate-500">
                {riskData.factors.mintingActivity}/100
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>Leaderboard Rank</span>
              </div>
              <div className="text-sm font-medium">
                {riskData.factors.leaderboardRank === 999
                  ? "Not Ranked"
                  : `#${riskData.factors.leaderboardRank}`}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Consistency</span>
              </div>
              <Progress value={riskData.factors.consistency} className="h-1" />
              <div className="text-xs text-slate-500">
                {riskData.factors.consistency}/100
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                <span>Volume</span>
              </div>
              <Progress value={riskData.factors.volume} className="h-1" />
              <div className="text-xs text-slate-500">
                {riskData.factors.volume}/100
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {riskData.explanation}
          </AlertDescription>
        </Alert>

        {/* Recommendations */}
        {riskData.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">AI Recommendations</h4>
            <div className="space-y-2">
              {riskData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
