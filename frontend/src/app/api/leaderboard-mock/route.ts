import { NextResponse } from "next/server";

export async function GET() {
  // Mock leaderboard data for testing
  const mockLeaderboard = [
    {
      rank: 1,
      address: "0x1234567890abcdef1234567890abcdef12345678",
      totalMinted: "50000",
    },
    {
      rank: 2,
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
      totalMinted: "35000",
    },
    {
      rank: 3,
      address: "0x9876543210fedcba9876543210fedcba98765432",
      totalMinted: "25000",
    },
    {
      rank: 4,
      address: "0xfedcba9876543210fedcba9876543210fedcba98",
      totalMinted: "15000",
    },
    {
      rank: 5,
      address: "0x1111222233334444555566667777888899990000",
      totalMinted: "10000",
    },
  ];

  return NextResponse.json({
    success: true,
    leaderboard: mockLeaderboard,
    totalEvents: 25,
    blockRange: {
      from: 1000000,
      to: 1010000,
    },
    chain: "RISE L2",
    token: "USDC",
  });
}
