import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { verifyAppAccess } from "../../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    // Fetch categories list
    const catSnapshot = await getDocs(collection(db, "news_categories"));
    let categories: any[] = [];
    catSnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error("API /api/app/news/categories error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news categories" }, { status: 500 });
  }
}
