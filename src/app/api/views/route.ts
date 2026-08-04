import { NextResponse } from "next/server";
import { getAllViewCounts } from "@/lib/views";

export const dynamic = "force-dynamic";

export async function GET() {
  const counts = getAllViewCounts();
  return NextResponse.json(
    { counts },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
