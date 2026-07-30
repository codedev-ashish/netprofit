import { NextRequest, NextResponse } from "next/server";
import { dbAdapter } from "@/lib/db/db-adapter";
import { subMinutes, subHours, subDays, subMonths, subYears, isAfter } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h";

    const allViews = await dbAdapter.getDocuments("pageviews");

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "realtime":
        startDate = subMinutes(now, 5);
        break;
      case "1h":
        startDate = subHours(now, 1);
        break;
      case "24h":
        startDate = subHours(now, 24);
        break;
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "3m":
        startDate = subMonths(now, 3);
        break;
      case "6m":
        startDate = subMonths(now, 6);
        break;
      case "1y":
        startDate = subYears(now, 1);
        break;
      case "all":
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Filter by date range
    const filteredViews = allViews.filter((view: any) => {
      if (!view.timestamp) return false;
      return isAfter(new Date(view.timestamp), startDate);
    });

    // Graph Data Aggregation
    const graphMap: Record<string, number> = {};
    const countryMap: Record<string, number> = {};
    const indiaLocMap: Record<string, number> = {};

    filteredViews.forEach((view: any) => {
      // 1. Graph Data
      const dateObj = new Date(view.timestamp);
      let timeKey = "";

      if (range === "realtime" || range === "1h") {
        // Group by minute
        timeKey = dateObj.toISOString().substring(11, 16); // HH:mm
      } else if (range === "24h") {
        // Group by hour
        timeKey = dateObj.toISOString().substring(11, 13) + ":00"; // HH:00
      } else {
        // Group by day
        timeKey = dateObj.toISOString().substring(0, 10); // YYYY-MM-DD
      }

      graphMap[timeKey] = (graphMap[timeKey] || 0) + 1;

      // 2. Country Data
      const country = view.country || "Unknown";
      countryMap[country] = (countryMap[country] || 0) + 1;

      // 3. India Locations
      if (country.toLowerCase() === "in" || country.toLowerCase() === "india") {
        const loc = `${view.city || "Unknown City"}, ${view.region || "Unknown Region"}`;
        indiaLocMap[loc] = (indiaLocMap[loc] || 0) + 1;
      }
    });

    // Format for charting
    const graphData = Object.entries(graphMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, visits]) => ({ name, visits }));

    const countryData = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1]) // sort descending
      .map(([name, visits]) => ({ name, visits }));

    const indiaData = Object.entries(indiaLocMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, visits]) => ({ name, visits }));

    return NextResponse.json({
      success: true,
      totalVisits: filteredViews.length,
      graphData,
      countryData,
      indiaData,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
