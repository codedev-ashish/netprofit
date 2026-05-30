import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Auth code is missing' }, { status: 400 });
    }

    const docRef = doc(db, 'settings', 'storage');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Storage settings not found' }, { status: 400 });
    }

    const { clientId, clientSecret } = docSnap.data();

    // Determine host dynamically
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/gdrive/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.refresh_token) {
      console.warn("No refresh token returned. User may need to revoke app permissions and re-link.");
    }

    // Retrieve user's email using Drive API about
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    let linkedEmail = 'Unknown Google Account';
    try {
      const about = await drive.about.get({ fields: 'user(emailAddress)' });
      if (about.data.user?.emailAddress) {
        linkedEmail = about.data.user.emailAddress;
      }
    } catch (e) {
      console.error('Failed to get user info:', e);
    }

    // Save tokens in Firestore
    const updateData: any = {
      linkedEmail,
      updatedAt: new Date().toISOString()
    };

    if (tokens.refresh_token) {
      updateData.refreshToken = tokens.refresh_token;
    }

    await updateDoc(docRef, updateData);

    // Redirect back to storage settings
    return NextResponse.redirect(`${protocol}://${host}/admin/settings/storage?oauth_success=true`);
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    return NextResponse.redirect(`${protocol}://${host}/admin/settings/storage?oauth_error=${encodeURIComponent(error.message)}`);
  }
}
