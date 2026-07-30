import { NextResponse } from 'next/server';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const collectionsToUpdate = ['ipos', 'news', 'tools', 'services'];
    let updatedCount = 0;
    const details: Record<string, number> = {};

    for (const colName of collectionsToUpdate) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      
      let colUpdatedCount = 0;
      const updatePromises = snapshot.docs.map(async (d) => {
        const data = d.data();
        // If customSchema is undefined, add it
        if (data.customSchema === undefined) {
          await updateDoc(doc(db, colName, d.id), { customSchema: '' });
          colUpdatedCount++;
          updatedCount++;
        }
      });
      
      await Promise.all(updatePromises);
      details[colName] = colUpdatedCount;
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated ${updatedCount} total documents.`,
      details 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
