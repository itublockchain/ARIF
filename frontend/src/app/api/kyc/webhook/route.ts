import { NextResponse } from "next/server";
import crypto from "crypto";

function verifySignature(
  rawBody: string,
  header: string,
  secret: string
): boolean {
  try {
    // header format: "t=unix_timestamp,v1=hex_signature"
    const match = header?.match(/t=(\d+),v1=([a-f0-9]+)/i);
    if (!match) return false;

    const [, timestamp, signature] = match;
    const payload = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch (error) {
    console.error("Error verifying Persona signature:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const secret = process.env.PERSONA_WEBHOOK_SECRET;
    const signature = req.headers.get("persona-signature") || "";

    if (!secret) {
      console.error("Persona webhook secret not configured");
      return new NextResponse("Webhook secret not configured", { status: 500 });
    }

    const rawBody = await req.text();

    if (!verifySignature(rawBody, signature, secret)) {
      console.error("Invalid Persona webhook signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log("Persona webhook event:", event);

    // Handle inquiry.completed event
    if (
      event?.data?.type === "inquiry" &&
      event?.meta?.eventName === "inquiry.completed"
    ) {
      const inquiryId = event.data.id;
      const status = event.data.attributes?.status; // "passed" | "failed" | "needs_review"
      const referenceId = event.data.attributes?.reference_id; // This is the wallet address
      const fullName = event.data.attributes?.name?.full || "";

      console.log("KYC completed:", {
        inquiryId,
        status,
        referenceId,
        fullName: fullName ? "***" : "not provided", // Don't log PII
      });

      // Create EAS KYC_PASSED attestation
      if (status === "passed" && referenceId) {
        console.log(`KYC passed for address: ${referenceId}`);

        try {
          // Create EAS attestation
          const attestationResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/attestation/kyc`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inquiryId,
                walletAddress: referenceId,
              }),
            }
          );

          if (attestationResponse.ok) {
            const attestationData = await attestationResponse.json();
            console.log(
              "KYC attestation created:",
              attestationData.attestationUID
            );
          } else {
            console.error(
              "Failed to create KYC attestation:",
              await attestationResponse.text()
            );
          }
        } catch (error) {
          console.error("Error creating KYC attestation:", error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Persona webhook:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
