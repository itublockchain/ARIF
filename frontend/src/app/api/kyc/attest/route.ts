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

    // For development, we'll use mock attestation if private key is not configured
    const privateKey = process.env.ATTESTATION_SIGNER_PRIVATE_KEY;

    if (!privateKey) {
      console.log("No private key configured, using mock attestation");
      // Return a mock attestation UID for development
      const mockAttestationUID = `0x${Math.random()
        .toString(16)
        .substr(2, 64)}`;
      return NextResponse.json({
        success: true,
        attestationUID: mockAttestationUID,
        message: "Mock KYC attestation created successfully (development mode)",
      });
    }

    // Initialize provider and signer
    const rpcUrl =
      process.env.NEXT_PUBLIC_RISE_RPC || "https://testnet.riselabs.xyz";

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
