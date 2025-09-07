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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!template || !envId) {
      return NextResponse.json(
        { error: "Persona configuration missing" },
        { status: 500 }
      );
    }

    // Mode B: Client-first approach
    // Direct hosted URL with inquiry-template-id
    const redirect = encodeURIComponent(`${baseUrl}/verify/callback`);

    const personaUrl =
      `https://inquiry.withpersona.com/inquiry` +
      `?inquiry-template-id=${template}` +
      `&environment-id=${envId}` +
      `&reference-id=${addr}` +
      `&redirect-uri=${redirect}`;

    return NextResponse.json({
      url: personaUrl,
      note: "Make sure 'Block client-side Inquiry creation' is disabled in template settings",
    });
  } catch (error) {
    console.error("Error creating Persona KYC URL:", error);
    return NextResponse.json(
      { error: "Failed to create KYC URL" },
      { status: 500 }
    );
  }
}
