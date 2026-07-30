import { NextRequest, NextResponse } from "next/server";
import { dbAdapter } from "@/lib/db/db-adapter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, country: clientCountry, city: clientCity, region: clientRegion } = body;

    // Extract headers for tracking
    const userAgent = req.headers.get("user-agent") || "Unknown";
    
    let country = clientCountry || req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country");
    let city = clientCity || req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city");
    let region = clientRegion || req.headers.get("cf-region") || req.headers.get("x-vercel-ip-country-region");

    // Fallback for local development testing
    if (!country) {
      if (process.env.NODE_ENV === 'development') {
        country = "IN";
        city = "Mumbai";
        region = "Maharashtra";
      } else {
        country = "Unknown";
        city = "Unknown";
        region = "Unknown";
      }
    }
    const ip = req.headers.get("x-forwarded-for") || "Unknown";

    const timestamp = new Date().toISOString();

    const visitData = {
      path: path || "/",
      referrer: referrer || "",
      userAgent,
      country,
      city,
      region,
      ip,
      timestamp,
    };

    await dbAdapter.addDocument("pageviews", visitData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ success: false, error: "Failed to track visit" }, { status: 500 });
  }
}
