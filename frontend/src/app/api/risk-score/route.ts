import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey === "your_gemini_api_key_here") {
      // Mock mode - return fake risk assessment for testing
      const walletData = leaderboardData?.find(
        (entry) => entry.address.toLowerCase() === walletAddress.toLowerCase()
      );

      const mockRiskAssessment: RiskScoreResponse = {
        walletAddress,
        riskScore: walletData ? Math.max(0, 100 - walletData.rank * 10) : 75, // Basic scoring based on rank
        riskLevel: walletData
          ? walletData.rank <= 3
            ? "LOW"
            : walletData.rank <= 7
            ? "MEDIUM"
            : "HIGH"
          : "HIGH",
        factors: {
          mintingActivity: walletData ? Math.min(100, walletData.rank * 15) : 0,
          leaderboardRank: walletData ? walletData.rank : 999,
          consistency: walletData ? Math.max(0, 100 - walletData.rank * 8) : 20,
          volume: walletData
            ? Math.min(100, parseInt(walletData.totalMinted) / 100)
            : 0,
        },
        explanation: walletData
          ? `Wallet ranked #${walletData.rank} with ${
              walletData.totalMinted
            } USDC minted. ${
              walletData.rank <= 5
                ? "Strong minting activity indicates good DeFi engagement."
                : "Limited minting activity suggests lower DeFi experience."
            }`
          : "No minting activity found. High risk due to lack of DeFi engagement history.",
        recommendations: walletData
          ? walletData.rank <= 5
            ? [
                "Continue current minting patterns",
                "Consider longer-term positions",
                "Maintain consistent activity",
              ]
            : [
                "Increase minting frequency",
                "Build more consistent patterns",
                "Engage more with DeFi protocols",
              ]
          : [
              "Start with small minting amounts",
              "Build DeFi engagement history",
              "Consider starting with test transactions",
            ],
      };

      return NextResponse.json({
        success: true,
        data: mockRiskAssessment,
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare data for Gemini analysis
    console.log("🔍 Risk Score API - Leaderboard Data:", leaderboardData);
    console.log("🔍 Risk Score API - Wallet Address:", walletAddress);

    const walletData = leaderboardData?.find(
      (entry) => entry.address.toLowerCase() === walletAddress.toLowerCase()
    );

    console.log("🔍 Risk Score API - Found Wallet Data:", walletData);

    const analysisPrompt = `
You are a DeFi risk assessment AI analyzing wallet behavior for a P2P lending platform.

WALLET ADDRESS: ${walletAddress}
LEADERBOARD DATA: ${JSON.stringify(leaderboardData || [])}
WALLET SPECIFIC DATA: ${JSON.stringify(walletData || {})}

IMPORTANT: Calculate risk score based on these rules:
- If wallet is #1 on leaderboard: riskScore = 15-25 (LOW RISK)
- If wallet is #2-3 on leaderboard: riskScore = 25-40 (LOW-MEDIUM RISK)  
- If wallet is #4-7 on leaderboard: riskScore = 40-60 (MEDIUM RISK)
- If wallet is #8+ on leaderboard: riskScore = 60-80 (MEDIUM-HIGH RISK)
- If wallet is NOT on leaderboard: riskScore = 80-95 (HIGH RISK)

Factors scoring:
- mintingActivity: 0-100 (higher = more activity)
- leaderboardRank: actual rank number (1, 2, 3, etc.)
- consistency: 0-100 (higher = more consistent)
- volume: 0-100 (higher = more volume)

Return ONLY a valid JSON response in this exact format:
{
  "riskScore": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "factors": {
    "mintingActivity": number,
    "leaderboardRank": number,
    "consistency": number,
    "volume": number
  },
  "explanation": "string",
  "recommendations": ["string", "string", "string"]
}

Do not include any other text or formatting.
`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse Gemini's JSON response
    let riskAssessment: RiskScoreResponse;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      riskAssessment = JSON.parse(jsonMatch[0]);

      // Validate the response structure
      if (
        typeof riskAssessment.riskScore !== "number" ||
        riskAssessment.riskScore < 0 ||
        riskAssessment.riskScore > 100
      ) {
        throw new Error("Invalid risk score");
      }

      if (!["LOW", "MEDIUM", "HIGH"].includes(riskAssessment.riskLevel)) {
        throw new Error("Invalid risk level");
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response:", text);

      // Fallback risk assessment
      riskAssessment = {
        walletAddress,
        riskScore: walletData ? Math.max(0, 100 - walletData.rank * 10) : 75, // Basic scoring based on rank
        riskLevel: walletData
          ? walletData.rank <= 3
            ? "LOW"
            : walletData.rank <= 7
            ? "MEDIUM"
            : "HIGH"
          : "HIGH",
        factors: {
          mintingActivity: walletData ? Math.min(100, walletData.rank * 15) : 0,
          leaderboardRank: walletData ? walletData.rank : 999,
          consistency: walletData ? Math.max(0, 100 - walletData.rank * 8) : 20,
          volume: walletData
            ? Math.min(100, parseInt(walletData.totalMinted) / 100)
            : 0,
        },
        explanation: walletData
          ? `Wallet ranked #${walletData.rank} with ${
              walletData.totalMinted
            } USDC minted. ${
              walletData.rank <= 5
                ? "Strong minting activity indicates good DeFi engagement."
                : "Limited minting activity suggests lower DeFi experience."
            }`
          : "No minting activity found. High risk due to lack of DeFi engagement history.",
        recommendations: walletData
          ? walletData.rank <= 5
            ? [
                "Continue current minting patterns",
                "Consider longer-term positions",
                "Maintain consistent activity",
              ]
            : [
                "Increase minting frequency",
                "Build more consistent patterns",
                "Engage more with DeFi protocols",
              ]
          : [
              "Start with small minting amounts",
              "Build DeFi engagement history",
              "Consider starting with test transactions",
            ],
      };
    }

    // Add wallet address to response
    riskAssessment.walletAddress = walletAddress;

    return NextResponse.json({
      success: true,
      data: riskAssessment,
    });
  } catch (error) {
    console.error("Error generating risk score:", error);
    return NextResponse.json(
      { error: "Failed to generate risk score" },
      { status: 500 }
    );
  }
}
