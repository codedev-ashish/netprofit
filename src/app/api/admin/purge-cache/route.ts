import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Purges the entire Next.js router cache for all paths
    revalidatePath("/", "layout");
    
    return NextResponse.json({ 
      success: true, 
      message: "Website cache purged successfully." 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to purge cache" },
      { status: 500 }
    );
  }
}
