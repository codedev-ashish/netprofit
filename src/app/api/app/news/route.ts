import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy, limit as limitDocs, startAfter, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { verifyAppAccess } from "../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");

    // Start building query
    let newsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"), limitDocs(limit));

    // Wait, filtering by category requires composite index if sorting by createdAt. 
    // We'll fetch all matching limit and filter in memory if category is provided to avoid index errors,
    // or just fetch all and return limit. For robust API without custom indexes:
    const querySnapshot = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
    
    let newsData: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Extract first image from HTML content for in-article image
      let inArticleImage = null;
      if (data.content) {
        // match <img src="...">
        const imgMatch = data.content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          inArticleImage = imgMatch[1];
        }
      }

      newsData.push({ 
        id: doc.id, 
        ...data,
        imageUrl: data.imageUrl || inArticleImage || null,
        coverImage: data.imageUrl || inArticleImage || null,
        inArticleImage: inArticleImage
      });
    });

    if (category) {
      newsData = newsData.filter(n => n.categories?.includes(category) || n.category === category);
    }

    // Apply limit after filter
    newsData = newsData.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: newsData
    });
  } catch (error: any) {
    console.error("API /api/app/news error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 });
  }
}
