import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const DEFAULT_APP_ADS = `# app-ads.txt - Authorized Digital Sellers for Mobile Applications
# Domain: netprofit.in
# Application: NetProfit Mobile (Android & iOS)
# Contact: support@netprofit.in
# Format: <Field #1>, <Field #2>, <Field #3>, <Field #4>

# Google AdMob
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0

# Unity Ads (Optional)
# unity3d.com, XXXXX, DIRECT

# Meta Audience Network (Optional)
# facebook.com, XXXXXXXXXXXXXXXX, DIRECT`;

export async function GET() {
  let content = DEFAULT_APP_ADS;
  try {
    const docRef = doc(db, "settings", "ads");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().appAdsTxt && docSnap.data().appAdsTxt.trim()) {
      content = docSnap.data().appAdsTxt;
    }
  } catch (err) {
    console.error("Error fetching app-ads.txt", err);
  }
  
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
