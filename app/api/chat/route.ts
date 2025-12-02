import { findLocationFlow } from "@/lib/ai/flows/find-location";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, context } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const result = await findLocationFlow({
      query,
      context,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in chat API:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Max retries exceeded")) {
      return NextResponse.json(
        { error: "Service currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (errorMessage.includes("API key not valid")) {
      return NextResponse.json(
        { error: "Invalid API configuration. Please check your API keys." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
