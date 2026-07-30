import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { verifyAppAccess } from "../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const querySnapshot = await getDocs(query(collection(db, "ipos")));
    let iposData: any[] = [];
    
    querySnapshot.forEach((doc) => {
      iposData.push({ id: doc.id, ...doc.data() });
    });

    // Simple client-side sorting assuming date fields or createdAt
    iposData.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA; // Descending
    });

    if (activeOnly) {
       iposData = iposData.filter(ipo => {
         const today = new Date();
         const closeDate = ipo.closeDate ? new Date(ipo.closeDate) : new Date(0);
         // basic check if IPO is still open (closeDate is after today)
         return closeDate >= today;
       });
    }

    iposData = iposData.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: iposData
    });
  } catch (error: any) {
    console.error("API /api/app/ipos error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch IPOs" }, { status: 500 });
  }
}
