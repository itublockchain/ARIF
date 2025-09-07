import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const addr = (searchParams.get("address") || "").toLowerCase();

    if (!addr) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    const template = process.env.PERSONA_INQUIRY_TEMPLATE_ID;
    const envId = process.env.PERSONA_ENV_ID;
    const apiKey = process.env.PERSONA_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!template || !envId || !apiKey) {
      return NextResponse.json(
        { error: "Persona configuration missing" },
        { status: 500 }
      );
    }

    // Mode A: API-first approach (recommended)
    // 1. Create inquiry via API
    const inquiryResponse = await fetch(
      "https://api.withpersona.com/api/v1/inquiries",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Persona-Version": "2023-01-05",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              "inquiry-template-id": template,
              "reference-id": addr,
              fields: {},
            },
          },
        }),
      }
    );

    if (!inquiryResponse.ok) {
      const errorData = await inquiryResponse.json();
      console.error("Persona API error:", errorData);
      
      // Handle specific error cases
      if (inquiryResponse.status === 429) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded. Please try again in a few minutes.",
            details: errorData,
            retryAfter: 60 // seconds
          },
          { status: 429 }
        );
      }
      
      if (inquiryResponse.status === 400 && errorData.errors?.[0]?.detail?.includes("already exists")) {
        return NextResponse.json(
          { 
            error: "KYC inquiry already exists for this address. Please check your existing inquiry.",
            details: errorData
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to create inquiry", details: errorData },
        { status: inquiryResponse.status }
      );
    }

    const inquiryData = await inquiryResponse.json();
    const inquiryId = inquiryData.data.id;

    // 2. Get session token for resume
    const resumeResponse = await fetch(
      `https://api.withpersona.com/api/v1/inquiries/${inquiryId}/resume`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Persona-Version": "2023-01-05",
          "Content-Type": "application/json",
        },
      }
    );

    if (!resumeResponse.ok) {
      const errorData = await resumeResponse.json();
      console.error("Persona resume error:", errorData);
      return NextResponse.json(
        { error: "Failed to get session token", details: errorData },
        { status: resumeResponse.status }
      );
    }

    const resumeData = await resumeResponse.json();
    const sessionToken = resumeData.meta["session-token"];

    // 3. Build hosted URL with session token
    const redirect = encodeURIComponent(`${baseUrl}/verify/callback`);
    const personaUrl = `https://inquiry.withpersona.com/inquiry?inquiry-id=${inquiryId}&session-token=${sessionToken}&redirect-uri=${redirect}`;

    return NextResponse.json({
      url: personaUrl,
      inquiryId: inquiryId,
    });
  } catch (error) {
    console.error("Error creating Persona KYC URL:", error);
    return NextResponse.json(
      { error: "Failed to create KYC URL" },
      { status: 500 }
    );
  }
}
