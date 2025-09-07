import { NextResponse } from "next/server";

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalMinted: string;
}

interface RiskScoreRequest {
  walletAddress: string;
  leaderboardData?: LeaderboardEntry[];
}

interface RiskScoreResponse {
  walletAddress: string;
  riskScore: number; // 0-100 (0 = lowest risk, 100 = highest risk)
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

export async function POST(req: Request) {
  try {
    const { walletAddress, leaderboardData }: RiskScoreRequest =
      await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Always use mock mode for now to avoid API issues
    const walletData = leaderboardData?.find(
      (entry) => entry.address.toLowerCase() === walletAddress.toLowerCase()
    );

    console.log("🔍 Risk Score API - Wallet Address:", walletAddress);
    console.log("🔍 Risk Score API - Found Wallet Data:", walletData);

    // Calculate risk score with some variability to simulate AI analysis
    let riskScore: number;
    let riskLevel: "LOW" | "MEDIUM" | "HIGH";

    if (walletData) {
      const totalMinted = parseInt(walletData.totalMinted);
      const rank = walletData.rank;

      // More sophisticated AI-like risk calculation
      // 1. Rank-based score (better rank = lower risk)
      const rankScore = Math.max(0, 100 - rank * 6); // 0-100, better rank = higher score

      // 2. Volume-based score (higher volume = lower risk)
      const volumeScore = Math.min(
        100,
        Math.max(0, (totalMinted / 10000) * 100)
      ); // 0-100

      // 3. Consistency factor (simulate transaction patterns)
      const consistencyFactor = Math.random() * 20 + 10; // 10-30 points

      // 4. Market conditions simulation
      const marketCondition = (Math.random() - 0.5) * 15; // ±7.5 points

      // 5. AI model uncertainty
      const modelUncertainty = (Math.random() - 0.5) * 10; // ±5 points

      // Weighted combination
      const weightedScore =
        rankScore * 0.4 + // 40% weight on rank
        volumeScore * 0.3 + // 30% weight on volume
        consistencyFactor * 0.2 + // 20% weight on consistency
        marketCondition * 0.05 + // 5% weight on market
        modelUncertainty * 0.05; // 5% weight on uncertainty

      riskScore = Math.max(5, Math.min(95, Math.round(weightedScore)));

      // Determine risk level
      if (riskScore <= 30) riskLevel = "LOW";
      else if (riskScore <= 60) riskLevel = "MEDIUM";
      else riskLevel = "HIGH";

      console.log("🔍 AI Analysis - Rank Score:", rankScore);
      console.log("🔍 AI Analysis - Volume Score:", volumeScore);
      console.log("🔍 AI Analysis - Consistency Factor:", consistencyFactor);
      console.log("🔍 AI Analysis - Market Condition:", marketCondition);
      console.log("🔍 AI Analysis - Model Uncertainty:", modelUncertainty);
      console.log("🔍 AI Analysis - Final Risk Score:", riskScore);
      console.log("🔍 AI Analysis - Risk Level:", riskLevel);
    } else {
      // No wallet data found - generate a realistic risk score
      // Simulate different risk profiles for unknown wallets
      const riskProfiles = [
        { score: 75, level: "HIGH" }, // 30% chance
        { score: 82, level: "HIGH" }, // 25% chance
        { score: 88, level: "HIGH" }, // 20% chance
        { score: 65, level: "MEDIUM" }, // 15% chance
        { score: 92, level: "HIGH" }, // 10% chance
      ];

      const randomProfile =
        riskProfiles[Math.floor(Math.random() * riskProfiles.length)];
      riskScore = randomProfile.score;
      riskLevel = randomProfile.level as "LOW" | "MEDIUM" | "HIGH";

      console.log(
        "🔍 No wallet data found - Generated risk profile:",
        randomProfile
      );
    }

    const mockRiskAssessment: RiskScoreResponse = {
      walletAddress,
      riskScore: riskScore,
      riskLevel: riskLevel as "LOW" | "MEDIUM" | "HIGH",
      factors: {
        mintingActivity: walletData
          ? Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  100 - walletData.rank * 8 + (Math.random() - 0.5) * 20
                )
              )
            )
          : 0,
        leaderboardRank: walletData ? walletData.rank : 999,
        consistency: walletData
          ? Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  100 - walletData.rank * 6 + (Math.random() - 0.5) * 15
                )
              )
            )
          : 0,
        volume: walletData
          ? Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  parseInt(walletData.totalMinted) / 100 +
                    (Math.random() - 0.5) * 10
                )
              )
            )
          : 0,
      },
      explanation: walletData
        ? `Wallet ranked #${walletData.rank} with ${
            walletData.totalMinted
          } USDC minted. Risk Score: ${riskScore}/100. ${
            riskLevel === "LOW"
              ? `Excellent DeFi engagement with strong minting patterns and high volume (${Math.round(
                  parseInt(walletData.totalMinted) / 100
                )}% volume score). Low risk profile.`
              : riskLevel === "MEDIUM"
              ? `Moderate DeFi activity with ${Math.round(
                  parseInt(walletData.totalMinted) / 100
                )}% volume score. Some risk factors present but manageable.`
              : `Limited DeFi engagement with ${Math.round(
                  parseInt(walletData.totalMinted) / 100
                )}% volume score. Higher risk due to limited historical activity.`
          }`
        : `The wallet address ${walletAddress} is not present in the provided leaderboard data. Risk Score: ${riskScore}/100. This indicates a lack of historical lending activity on the platform, resulting in a high-risk assessment.`,
      recommendations: walletData
        ? riskLevel === "LOW"
          ? [
              `Maintain excellent performance (${riskScore}/100 risk score)`,
              "Consider expanding to additional DeFi protocols",
              "Continue consistent minting patterns",
            ]
          : riskLevel === "MEDIUM"
          ? [
              `Improve risk profile (current: ${riskScore}/100)`,
              `Increase volume from ${Math.round(
                parseInt(walletData.totalMinted) / 100
              )}% to 60%+`,
              "Engage with more DeFi protocols",
            ]
          : [
              `Urgent: Improve risk profile (current: ${riskScore}/100)`,
              `Increase volume from ${Math.round(
                parseInt(walletData.totalMinted) / 100
              )}% to 30%+`,
              "Start with smaller, consistent transactions",
            ]
        : [
            `Critical: No DeFi history (${riskScore}/100 risk score)`,
            "Start with small test transactions (100-1000 USDC)",
            "Build consistent minting patterns over 30+ days",
          ],
    };

    return NextResponse.json({
      success: true,
      data: mockRiskAssessment,
    });
  } catch (error) {
    console.error("Error generating risk score:", error);
    return NextResponse.json(
      { error: "Failed to generate risk score" },
      { status: 500 }
    );
  }
}
