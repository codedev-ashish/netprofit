import { NextResponse } from "next/server";
import { verifyAppAccess } from "../../auth";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    // Services categories in the admin panel are primarily hardcoded:
    // Registration, Filing Returns, Accounting, Compliance
    // We will fetch all published services to get a dynamic list of active categories just in case
    const querySnapshot = await getDocs(query(collection(db, "services")));
    const categorySet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublished !== false && data.category) {
        categorySet.add(data.category);
      }
    });

    // If no services exist yet, return the default known ones
    let categories = Array.from(categorySet);
    if (categories.length === 0) {
      categories = ["Registration", "Filing Returns", "Accounting", "Compliance"];
    } else {
      categories.sort();
    }

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error("API /api/app/services/categories error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch service categories" }, { status: 500 });
  }
}
