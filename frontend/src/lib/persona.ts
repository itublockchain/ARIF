// Persona API service for checking inquiry status
export interface PersonaInquiry {
  id: string;
  status: "pending" | "passed" | "failed" | "needs_review";
  attributes: {
    reference_id?: string;
    name?: {
      full?: string;
    };
  };
}

export class PersonaService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PERSONA_API_KEY || "";
    this.baseUrl =
      process.env.PERSONA_ENV === "PRODUCTION"
        ? "https://withpersona.com/api/v1"
        : "https://sandbox.withpersona.com/api/v1";
  }

  async getInquiry(inquiryId: string): Promise<PersonaInquiry | null> {
    try {
      const response = await fetch(`${this.baseUrl}/inquiries/${inquiryId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Persona API error:",
          response.status,
          await response.text()
        );
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching Persona inquiry:", error);
      return null;
    }
  }

  async checkInquiryStatus(inquiryId: string): Promise<{
    status: "pending" | "passed" | "failed" | "needs_review" | "error";
    inquiry?: PersonaInquiry;
  }> {
    try {
      const inquiry = await this.getInquiry(inquiryId);

      if (!inquiry) {
        return { status: "error" };
      }

      return {
        status: inquiry.status,
        inquiry,
      };
    } catch (error) {
      console.error("Error checking inquiry status:", error);
      return { status: "error" };
    }
  }
}

// Export singleton instance
export const personaService = new PersonaService();
