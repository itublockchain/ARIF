import { NextResponse } from "next/server";
import { createCreditGradeAttestation } from "@/lib/eas";
import { ethers } from "ethers";

export async function POST(req: Request) {
  try {
    const { grade, score, walletAddress } = await req.json();

    if (!grade || !score || !walletAddress) {
      return NextResponse.json(
        { error: "grade, score, and walletAddress are required" },
        { status: 400 }
      );
    }

    if (!["A", "B", "C"].includes(grade)) {
      return NextResponse.json(
        { error: "Grade must be A, B, or C" },
        { status: 400 }
      );
    }

    // Initialize provider and signer
    const rpcUrl = process.env.RISE_RPC_URL || "https://rpc.rise.technology";
    const privateKey = process.env.ATTESTATION_SIGNER_PRIVATE_KEY;

    if (!privateKey) {
      return NextResponse.json(
        { error: "Attestation signer private key not configured" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    // Create credit grade attestation
    const attestationUID = await createCreditGradeAttestation(
      provider,
      signer,
      grade as "A" | "B" | "C",
      score,
      walletAddress
    );

    return NextResponse.json({
      success: true,
      attestationUID,
      message: "Credit grade attestation created successfully",
    });
  } catch (error) {
    console.error("Error creating credit grade attestation:", error);
    return NextResponse.json(
      { error: "Failed to create credit grade attestation" },
      { status: 500 }
    );
  }
}
