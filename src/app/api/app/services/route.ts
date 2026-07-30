import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { verifyAppAccess } from "../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const querySnapshot = await getDocs(query(collection(db, "services")));
    let servicesData: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublished !== false) {
        servicesData.push({ id: doc.id, ...data });
      }
    });

    if (category) {
      servicesData = servicesData.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }

    // Sort by name or createdAt
    servicesData.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
         return b.createdAt.seconds - a.createdAt.seconds;
      }
      return a.name?.localeCompare(b.name || "") || 0;
    });

    return NextResponse.json({
      success: true,
      data: servicesData
    });
  } catch (error: any) {
    console.error("API /api/app/services error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch services" }, { status: 500 });
  }
}
