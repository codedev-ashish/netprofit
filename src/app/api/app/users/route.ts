import { NextResponse } from "next/server";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { verifyAppAccess } from "../auth";

export async function GET(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing uid parameter" }, { status: 400 });
    }

    const userDoc = await getDoc(doc(db, "users", uid));
    
    if (!userDoc.exists()) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { id: userDoc.id, ...userDoc.data() }
    });
  } catch (error: any) {
    console.error("API /api/app/users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user details" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accessError = await verifyAppAccess(request);
    if (accessError) return accessError;

    const body = await request.json();
    const { uid, email, displayName, photoURL, phoneNumber } = body;

    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing uid in request body" }, { status: 400 });
    }

    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    const userData = {
      email: email || null,
      displayName: displayName || null,
      photoURL: photoURL || null,
      phoneNumber: phoneNumber || null,
      lastActiveAt: serverTimestamp()
    };

    if (!userDoc.exists()) {
      // Create new user record from mobile login
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        role: "user"
      });
    } else {
      // Update existing user
      await setDoc(userRef, userData, { merge: true });
    }

    // Fetch updated
    const updatedDoc = await getDoc(userRef);

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error: any) {
    console.error("API /api/app/users error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync user details" }, { status: 500 });
  }
}
