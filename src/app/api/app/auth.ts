import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export async function verifyAppAccess(request: Request) {
  try {
    const docRef = doc(db, "settings", "mobile_app");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null; // Allow if no settings configured yet
    }

    const data = docSnap.data();

    // Check if APIs are globally disabled
    if (data.apiEnabled === false) {
      return NextResponse.json(
        { success: false, error: "Mobile APIs are temporarily disabled by the administrator." },
        { status: 503 }
      );
    }

    // Check package name restriction
    const requiredPackage = data.appPackageName;
    if (requiredPackage) {
      const providedPackage = request.headers.get("x-app-package-name");
      if (!providedPackage || providedPackage !== requiredPackage) {
        return NextResponse.json(
          { success: false, error: "Unauthorized access. Invalid or missing app package name." },
          { status: 403 }
        );
      }
    }

    return null; // Access granted (no error response generated)
  } catch (error) {
    console.error("Error verifying app access:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error during access validation." },
      { status: 500 }
    );
  }
}
 
