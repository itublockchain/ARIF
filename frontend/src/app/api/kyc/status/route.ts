import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get("inquiryId");

    if (!inquiryId) {
      return NextResponse.json({ error: "missing inquiryId" }, { status: 400 });
    }

    const apiKey = process.env.PERSONA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Persona API key not configured" },
        { status: 500 }
      );
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
      // Persona sandbox'ında completed status'u genelde onay anlamına gelir
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
