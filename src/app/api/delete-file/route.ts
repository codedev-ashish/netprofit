import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required for deletion.' }, { status: 400 });
    }

    // 1. Fetch storage configuration from Firestore
    const docRef = doc(db, 'settings', 'storage');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Storage settings not found.' }, { status: 400 });
    }

    const config = docSnap.data();
    const storageProvider: string = config.storageProvider || (config.gdriveEnabled ? 'gdrive' : 'firebase');

    if (storageProvider === 'firebase') {
      return NextResponse.json({ error: 'Firebase Storage deletions should be handled client-side.' }, { status: 400 });
    }

    // ── iDrive e2 (S3-Compatible) / Cloudflare ─────────────────────────────────
    if (storageProvider === 'idrive') {
      let { idriveAccessKey, idriveSecretKey, idriveEndpoint, idriveRegion, idriveBucket } = config;
      idriveBucket = idriveBucket || "netprofit";

      if (!idriveAccessKey || !idriveSecretKey || !idriveEndpoint || !idriveRegion || !idriveBucket) {
        return NextResponse.json({ error: 'iDrive e2 / S3 is not fully configured.' }, { status: 500 });
      }

      const s3 = new S3Client({
        region: idriveRegion,
        endpoint: `https://${idriveEndpoint}`,
        credentials: {
          accessKeyId: idriveAccessKey,
          secretAccessKey: idriveSecretKey,
        },
        forcePathStyle: true,
      });

      const command = new DeleteObjectCommand({
        Bucket: idriveBucket,
        Key: fileId,
      });

      await s3.send(command);

      return NextResponse.json({ success: true, message: 'File deleted successfully from S3 storage.' });
    }

    // ── Google Drive ───────────────────────────────────────────────────────────
    if (storageProvider === 'gdrive') {
      const { gdriveMode } = config;

      let auth: any;
      if (gdriveMode === 'oauth') {
        const { clientId, clientSecret, refreshToken } = config;
        if (!clientId || !clientSecret || !refreshToken) {
          return NextResponse.json({ error: 'Google Drive OAuth is not fully configured.' }, { status: 500 });
        }
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        auth = oauth2Client;
      } else {
        const { clientEmail, privateKey } = config;
        let finalEmail = clientEmail || '';
        let finalKey = privateKey || '';

        if (finalKey.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(finalKey);
            if (parsed.private_key) finalKey = parsed.private_key;
            if (parsed.client_email) finalEmail = parsed.client_email;
          } catch (e) {
            console.error('Failed to parse JSON credentials:', e);
          }
        }

        if (!finalEmail || !finalKey) {
          return NextResponse.json({ error: 'Google Drive service account is not fully configured.' }, { status: 500 });
        }

        auth = new google.auth.JWT({
          email: finalEmail,
          key: finalKey.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      }

      const drive = google.drive({ version: 'v3', auth });

      await drive.files.delete({
        fileId: fileId,
        supportsAllDrives: true,
      });

      return NextResponse.json({ success: true, message: 'File deleted successfully from Google Drive.' });
    }

    return NextResponse.json({ error: 'Unknown storage provider configured.' }, { status: 500 });
  } catch (error: any) {
    console.error('Deletion error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
