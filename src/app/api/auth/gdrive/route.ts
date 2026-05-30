import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(req: Request) {
  try {
    const docRef = doc(db, 'settings', 'storage');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Storage settings not configured' }, { status: 400 });
    }

    const { clientId, clientSecret } = docSnap.data();
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google Client ID or Client Secret is missing in settings' }, { status: 400 });
    }

    // Determine host dynamically
    const { headers } = req;
    const host = headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/gdrive/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Generate Auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // crucial to get refresh token
      prompt: 'consent', // crucial to ensure refresh token is returned every time
      scope: ['https://www.googleapis.com/auth/drive']
    });

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('OAuth Init Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
