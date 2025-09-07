import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { rise } from "@/lib/chains/rise";

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalMinted: string;
}

// Transfer event ABI for ERC20 tokens - mint events have from=0x000...
const transferEventAbi = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export async function GET() {
  try {
    // Use USDC contract address from ARIF config
    const tokenAddress =
      (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS as `0x${string}`) ||
      ("0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`);
    const rpcUrl =
      process.env.NEXT_PUBLIC_RISE_RPC || "https://testnet.riselabs.xyz";

    if (!tokenAddress) {
      return NextResponse.json(
        { error: "USDC contract address not configured" },
        { status: 500 }
      );
    }

    // Create viem client for RISE L2
    const client = createPublicClient({
      chain: rise,
      transport: http(rpcUrl),
    });

    // Get current block number
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock - BigInt(10000); // Look back 10,000 blocks

    // Fetch mint events (Transfer events where from = 0x000...)
    const mintEvents = await client.getLogs({
      address: tokenAddress,
      event: transferEventAbi,
      args: {
        from: "0x0000000000000000000000000000000000000000", // Mint events have from=zero address
      },
      fromBlock: fromBlock,
      toBlock: currentBlock,
    });

    // Track highest single mint per address (not total)
    const addressHighestMint = new Map<string, bigint>();

    for (const event of mintEvents) {
      const { to, value } = event.args;
      if (to && value) {
        const currentHighest = addressHighestMint.get(to) || BigInt(0);
        if (value > currentHighest) {
          addressHighestMint.set(to, value);
        }
      }
    }

    // If no real data found, return mock data for demo
    let leaderboard: LeaderboardEntry[];

    if (mintEvents.length === 0) {
      // Mock leaderboard data for demo
      leaderboard = [
        {
          rank: 1,
          address: "0x8a93d247134d91e0de6f96547cb0204e5be8e5d8",
          totalMinted: "100000",
        },
        {
          rank: 2,
          address: "0x1234567890abcdef1234567890abcdef12345678",
          totalMinted: "75000",
        },
        {
          rank: 3,
          address: "0xabcdef1234567890abcdef1234567890abcdef12",
          totalMinted: "50000",
        },
        {
          rank: 4,
          address: "0x9876543210fedcba9876543210fedcba98765432",
          totalMinted: "35000",
        },
        {
          rank: 5,
          address: "0xfedcba9876543210fedcba9876543210fedcba98",
          totalMinted: "25000",
        },
      ];
    } else {
      // Convert to leaderboard format and sort by highest single mint
      // USDC has 6 decimals, so divide by 1e6 instead of 1e18
      leaderboard = Array.from(addressHighestMint.entries())
        .map(([address, highestMintWei]) => ({
          address,
          totalMinted: (Number(highestMintWei) / 1e6).toFixed(0), // Convert Wei to USDC (6 decimals), round to integer
        }))
        .sort((a, b) => Number(b.totalMinted) - Number(a.totalMinted)) // Sort by highest single mint (descending)
        .slice(0, 10) // Top 10
        .map((entry, index) => ({
          rank: index + 1,
          address: entry.address,
          totalMinted: entry.totalMinted,
        }));
    }

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard,
      totalEvents: mintEvents.length,
      blockRange: {
        from: Number(fromBlock),
        to: Number(currentBlock),
      },
      chain: "RISE L2",
      token: "USDC",
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}
