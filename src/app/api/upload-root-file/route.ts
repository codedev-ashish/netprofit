import { NextResponse } from 'next/server';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "rootFiles"));
    const files = snap.docs.map(doc => ({
      name: doc.id,
      size: doc.data().size || 0
    }));
    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Error fetching root files:", error);
    return NextResponse.json({ error: "Failed to read database" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    const fileName = file.name;
    if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Determine content type
    let contentType = "text/plain";
    if (fileName.endsWith('.html')) contentType = "text/html";
    else if (fileName.endsWith('.xml')) contentType = "application/xml";
    else if (fileName.endsWith('.js')) contentType = "application/javascript";
    
    // Store in Firestore
    const docRef = doc(db, "rootFiles", fileName);
    await setDoc(docRef, {
      name: fileName,
      content: buffer.toString('base64'),
      contentType: contentType,
      size: buffer.length,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, message: `File ${fileName} successfully uploaded.` });
  } catch (error: any) {
    console.error("Error uploading root file:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    
    if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    
    const docRef = doc(db, "rootFiles", fileName);
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true, message: `File ${fileName} deleted.` });
  } catch (error: any) {
    console.error("Error deleting root file:", error);
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 500 });
  }
}
