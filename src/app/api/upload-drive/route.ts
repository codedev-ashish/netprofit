import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Readable } from 'stream';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Helper to sanitize folder/key names
const cleanName = (name: string) =>
  (name || 'unknown').replace(/[\\/:*?"<>|]/g, '').trim();

// ─── Google Drive helpers ─────────────────────────────────────────────────────

async function getOrCreateFolder(drive: any, folderName: string, parentId: string): Promise<string> {
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`;

  const res = await drive.files.list({
    q,
    spaces: 'drive',
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
    supportsAllDrives: true,
  });

  return folder.data.id!;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. Fetch storage configuration from Firestore
    const docRef = doc(db, 'settings', 'storage');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Storage settings not found. Please configure storage in Admin Settings.' }, { status: 400 });
    }

    const config = docSnap.data();

    // Support legacy `gdriveEnabled` boolean AND new `storageProvider` field
    const storageProvider: string = config.storageProvider ||
      (config.gdriveEnabled ? 'gdrive' : 'firebase');

    if (storageProvider === 'firebase') {
      return NextResponse.json({ error: 'Firebase Storage uploads are handled client-side. This API is for Google Drive / iDrive only.' }, { status: 400 });
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uploadType = (formData.get('uploadType') as string) || 'user';
    const userVal = (formData.get('user') as string) || 'unknown-user';
    const businessVal = (formData.get('business') as string) || 'unknown-business';
    const serviceVal = (formData.get('service') as string) || 'unknown-service';
    const taxYearVal = (formData.get('taxYear') as string) || 'unknown-tax-year';
    const periodVal = (formData.get('period') as string) || 'Annual';

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── iDrive e2 (S3-Compatible) ──────────────────────────────────────────────
    if (storageProvider === 'idrive') {
      let { idriveAccessKey, idriveSecretKey, idriveEndpoint, idriveRegion, idriveBucket } = config;
      idriveBucket = idriveBucket || "netprofit";

      if (!idriveAccessKey || !idriveSecretKey || !idriveEndpoint || !idriveRegion || !idriveBucket) {
        return NextResponse.json({ error: 'iDrive e2 is not fully configured. Please check Admin Settings → Storage.' }, { status: 500 });
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

      // Build S3 key (path in bucket)
      let s3Key: string;
      if (uploadType === 'admin') {
        // admin-documents/{user}/{business}/{service}/{tax-year}/{filename}
        s3Key = [
          'admin-documents',
          cleanName(userVal),
          cleanName(businessVal),
          cleanName(serviceVal),
          cleanName(taxYearVal),
          file.name,
        ].join('/');
      } else if (uploadType === 'settings') {
        s3Key = [
          'settings',
          file.name,
        ].join('/');
      } else {
        // user-upload/{business}/{service}/{tax-year}/{period}/{filename}
        s3Key = [
          'user-upload',
          cleanName(businessVal),
          cleanName(serviceVal),
          cleanName(taxYearVal),
          cleanName(periodVal),
          file.name,
        ].join('/');
      }

      const command = new PutObjectCommand({
        Bucket: idriveBucket,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
        // Note: iDrive e2 does not support ACL headers — access is controlled via bucket policy
      });

      await s3.send(command);

      // Generate a presigned URL valid for 7 days for file access
      const presignedUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: idriveBucket, Key: s3Key }),
        { expiresIn: 604800 } // 7 days
      );

      // Also build the direct public URL (works if bucket has public policy set in iDrive console)
      const directUrl = `https://${idriveBucket}.${idriveEndpoint}/${s3Key}`;

      // Re-generate a GET presigned URL for viewing
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const viewUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: idriveBucket, Key: s3Key }),
        { expiresIn: 604800 } // 7 days
      );

      return NextResponse.json({
        fileId: s3Key,
        webViewLink: viewUrl,
        webContentLink: directUrl,
      });
    }

    // ── Google Drive ───────────────────────────────────────────────────────────
    if (storageProvider === 'gdrive') {
      const { parentFolderId, gdriveMode } = config;

      if (!parentFolderId) {
        return NextResponse.json({ error: 'Google Drive root folder ID is missing in settings.' }, { status: 500 });
      }

      // Authenticate
      let auth: any;
      if (gdriveMode === 'oauth') {
        const { clientId, clientSecret, refreshToken } = config;
        if (!clientId || !clientSecret || !refreshToken) {
          return NextResponse.json({ error: 'Google Drive OAuth is not fully configured: missing Client ID, Client Secret, or Refresh Token.' }, { status: 500 });
        }
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        auth = oauth2Client;
      } else {
        // Service Account
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
          return NextResponse.json({ error: 'Google Drive service account is not fully configured: missing email or private key.' }, { status: 500 });
        }

        auth = new google.auth.JWT({
          email: finalEmail,
          key: finalKey.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      }

      const drive = google.drive({ version: 'v3', auth });

      // Resolve folder path
      let currentFolderId = parentFolderId;
      let folderPath: string[] = [];
      if (uploadType === 'admin') {
        folderPath = ['admin-documents', cleanName(userVal), cleanName(businessVal), cleanName(serviceVal), cleanName(taxYearVal)];
      } else if (uploadType === 'settings') {
        folderPath = ['settings'];
      } else {
        folderPath = ['user-upload', cleanName(businessVal), cleanName(serviceVal), cleanName(taxYearVal), cleanName(periodVal)];
      }

      for (const folder of folderPath) {
        currentFolderId = await getOrCreateFolder(drive, folder, currentFolderId);
      }

      // Upload file
      const media = {
        mimeType: file.type || 'application/octet-stream',
        body: Readable.from(buffer),
      };

      const response = await drive.files.create({
        requestBody: { name: file.name, parents: [currentFolderId] },
        media,
        fields: 'id, webViewLink, webContentLink',
        supportsAllDrives: true,
      });

      // Make publicly readable
      await drive.permissions.create({
        fileId: response.data.id!,
        supportsAllDrives: true,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      return NextResponse.json({
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
      });
    }

    return NextResponse.json({ error: 'Unknown storage provider configured.' }, { status: 500 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
