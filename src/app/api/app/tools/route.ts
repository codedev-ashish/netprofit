import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { verifyAppAccess } from "../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    // Only return tools that are visible
    const querySnapshot = await getDocs(query(collection(db, "tools")));
    let toolsData: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Assume tools have some visibility or active flag, or just return all
      if (data.isPublished !== false) {
        toolsData.push({ id: doc.id, ...data });
      }
    });

    toolsData.sort((a, b) => {
      return a.name?.localeCompare(b.name || "") || 0;
    });

    return NextResponse.json({
      success: true,
      data: toolsData
    });
  } catch (error: any) {
    console.error("API /api/app/tools error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tools" }, { status: 500 });
  }
}
