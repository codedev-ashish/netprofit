import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { verifyAppAccess } from "../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    const docRef = doc(db, "settings", "mobile_app");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: true,
        data: {
          minVersionAndroid: "1.0.0",
          minVersionIos: "1.0.0",
          forceUpdate: false,
          maintenanceMode: false,
          features: {
            enableNews: true,
            enableIpos: true,
            enableServices: true,
            enableTools: true,
            enableAuth: true,
            enableActivity: true
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: docSnap.data()
    });
  } catch (error: any) {
    console.error("API /api/app/config error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch mobile app configuration" }, { status: 500 });
  }
}
