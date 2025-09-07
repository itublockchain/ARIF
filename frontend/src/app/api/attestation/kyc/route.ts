import { NextResponse } from "next/server";
import { createKYCAttestation } from "@/lib/eas";
import { ethers } from "ethers";

export async function POST(req: Request) {
  try {
    const { inquiryId, walletAddress } = await req.json();

    if (!inquiryId || !walletAddress) {
      return NextResponse.json(
        { error: "inquiryId and walletAddress are required" },
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

    // Create KYC attestation
    const attestationUID = await createKYCAttestation(
      provider,
      signer,
      inquiryId,
      walletAddress
    );

    return NextResponse.json({
      success: true,
      attestationUID,
      message: "KYC attestation created successfully",
    });
  } catch (error) {
    console.error("Error creating KYC attestation:", error);
    return NextResponse.json(
      { error: "Failed to create KYC attestation" },
      { status: 500 }
    );
  }
}
