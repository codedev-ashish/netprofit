import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const DEFAULT_ADS = `# ads.txt - Authorized Digital Sellers
# Domain: netprofit.in
# Contact: support@netprofit.in
# Format: <Field #1>, <Field #2>, <Field #3>, <Field #4>
# Field #1: Domain name of the advertising system (e.g., google.com)
# Field #2: Exchange Publisher ID (e.g., pub-XXXXXXXXXXXXXXXX)
# Field #3: Account type (DIRECT or RESELLER)
# Field #4: Certification Authority ID (e.g., f08c47fec0942fa0 for Google AdSense)

# Google AdSense
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`;

export async function GET() {
  let content = DEFAULT_ADS;
  try {
    const docRef = doc(db, "settings", "ads");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().adsTxt && docSnap.data().adsTxt.trim()) {
      content = docSnap.data().adsTxt;
    }
  } catch (err) {
    console.error("Error fetching ads.txt", err);
  }
  
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
