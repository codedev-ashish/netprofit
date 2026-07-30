import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy, limit as limitDocs, where } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { verifyAppAccess } from "../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing uid parameter" }, { status: 400 });
    }

    // Assuming we log user activity or notifications in a collection named "activities" or "notifications"
    // We will query "notifications" here as it's more standard for an activity feed
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limitDocs(limit)
    );
    
    const querySnapshot = await getDocs(q);
    let activityData: any[] = [];
    
    querySnapshot.forEach((doc) => {
      activityData.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({
      success: true,
      data: activityData
    });
  } catch (error: any) {
    console.error("API /api/app/activity error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch app activity" }, { status: 500 });
  }
}
