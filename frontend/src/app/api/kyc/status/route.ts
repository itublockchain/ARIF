import { NextResponse } from "next/server";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per inquiryId

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get("inquiryId");

    if (!inquiryId) {
      return NextResponse.json({ error: "missing inquiryId" }, { status: 400 });
    }

    // Rate limiting check
    const now = Date.now();
    const key = inquiryId;
    const rateLimit = rateLimitMap.get(key);

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded. Please wait before checking again.",
              retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000),
            },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        // Reset the counter
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    const apiKey = process.env.PERSONA_API_KEY;
    if (!apiKey) {
      console.log("No Persona API key configured, using mock response");
      // Return mock data for development
      return NextResponse.json({
        status: "completed",
        decision: "approved",
        outcome: "approved",
        ui: "APPROVED",
        raw: { mock: true, inquiryId },
      });
    }

    const response = await fetch(
      `https://api.withpersona.com/api/v1/inquiries/${inquiryId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Persona-Version": "2023-01-05",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Persona API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch inquiry status", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const status = data?.data?.attributes?.status;
    const decision = data?.data?.attributes?.decision;
    const outcome = data?.data?.attributes?.outcome;

    // UI için normalize et
    let ui: "APPROVED" | "DECLINED" | "PENDING" | "ERROR" = "PENDING";

    if (
      status === "approved" ||
      decision === "approved" ||
      outcome === "approved"
    ) {
      ui = "APPROVED";
    } else if (
      status === "declined" ||
      decision === "declined" ||
      outcome === "declined"
    ) {
      ui = "DECLINED";
    } else if (status === "completed") {
      // In Persona sandbox, completed status generally means approved
      ui = "APPROVED";
    } else if (
      status === "pending" ||
      status === "in_progress" ||
      status === "created"
    ) {
      ui = "PENDING";
    } else if (!status) {
      ui = "ERROR";
    }

    return NextResponse.json({
      status,
      decision,
      outcome,
      ui,
      raw: data,
    });
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC status" },
      { status: 500 }
    );
  }
}
