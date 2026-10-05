import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import db from '../../db/database';

dotenv.config();

export interface GDriveUploadResult {
  googleDriveFileId: string;
  googleDriveFolderId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  webViewLink: string;
  localStoragePath: string;
  isCloudSynced: boolean;
}

export class GoogleDriveService {
  private baseFolderId: string;
  private localMirrorBase: string;
  private driveClient: any = null;

  constructor() {
    this.baseFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x';
    const isVercel = !!process.env.VERCEL;
    const baseStorage = isVercel
      ? '/tmp/storage'
      : path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './storage');
    this.localMirrorBase = path.resolve(baseStorage, 'google_drive_mirror');

    try {
      if (!fs.existsSync(this.localMirrorBase)) {
        fs.mkdirSync(this.localMirrorBase, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not create local mirror directory:', e);
    }

    this.initDriveClient();
  }

  private initDriveClient() {
    const credsPath = path.resolve(process.cwd(), process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || './config/google_credentials.json');
    if (fs.existsSync(credsPath)) {
      try {
        const auth = new google.auth.GoogleAuth({
          keyFile: credsPath,
          scopes: ['https://www.googleapis.com/auth/drive.file']
        });
        this.driveClient = google.drive({ version: 'v3', auth });
        console.log('Google Drive API client successfully initialized with credentials.');
      } catch (err: any) {
        console.warn('Could not initialize Google Drive credentials, using local mirror fallback:', err.message);
      }
    } else {
      console.log('Google Drive credentials file not found. Operating with local repository mirror & cloud folder linking.');
    }
  }

  public calculateHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  public async uploadRawFile(
    tempFilePath: string,
    originalFileName: string,
    mimeType: string,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth() + 1
  ): Promise<GDriveUploadResult> {
    const stats = fs.statSync(tempFilePath);
    const fileHash = this.calculateHash(tempFilePath);
    const monthStr = `${month.toString().padStart(2, '0')}-${this.getMonthName(month)}`;

    // Get current folder ID from DB if configured
    let folderId = this.baseFolderId;
    try {
      const row = db.prepare("SELECT value FROM system_settings WHERE key = 'GOOGLE_DRIVE_FOLDER_ID'").get() as any;
      if (row?.value) folderId = row.value;
    } catch {}

    // Local mirror target folder: storage/google_drive_mirror/2026/01-Januari/RAW/
    const mirrorDir = path.join(this.localMirrorBase, year.toString(), monthStr, 'RAW');
    try {
      if (!fs.existsSync(mirrorDir)) {
        fs.mkdirSync(mirrorDir, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not create mirror subfolder:', e);
    }

    const uniquePrefix = Date.now();
    const safeName = `${uniquePrefix}_${originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destinationPath = path.join(mirrorDir, safeName);
    fs.copyFileSync(tempFilePath, destinationPath);

    let driveFileId = `gdrive-local-${uniquePrefix}`;
    let webViewLink = `https://drive.google.com/drive/folders/${folderId}`;
    let isCloudSynced = false;

    // Upload to official Google Drive API if client is authenticated
    if (this.driveClient) {
      try {
        const fileMetadata = {
          name: originalFileName,
          parents: [folderId]
        };
        const media = {
          mimeType: mimeType || 'application/octet-stream',
          body: fs.createReadStream(tempFilePath)
        };

        const res = await this.driveClient.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id, webViewLink'
        });

        if (res.data?.id) {
          driveFileId = res.data.id;
          webViewLink = res.data.webViewLink || webViewLink;
          isCloudSynced = true;
          console.log(`File successfully synced to Google Drive: ${driveFileId}`);
        }
      } catch (err: any) {
        console.warn('Google Drive API upload failed, saved to local mirror:', err.message);
      }
    }

    // Upload via Google Apps Script Web App webhook if configured (env or system_settings)
    let appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    try {
      const row = db.prepare("SELECT value FROM system_settings WHERE key = 'GOOGLE_APPS_SCRIPT_URL'").get() as any;
      if (row?.value) appsScriptUrl = row.value;
    } catch {}

    if (!isCloudSynced && appsScriptUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const fileBuffer = fs.readFileSync(tempFilePath);
        const fileBase64 = fileBuffer.toString('base64');
        const payload = {
          folderId: folderId,
          fileName: originalFileName,
          mimeType: mimeType || 'application/octet-stream',
          fileData: fileBase64
        };

        const postRes = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          redirect: 'manual',
          signal: controller.signal
        });

        let gasData: any = null;
        if (postRes.status === 302 || postRes.status === 301) {
          const redirectUrl = postRes.headers.get('location');
          if (redirectUrl) {
            const getRes = await fetch(redirectUrl, { signal: controller.signal });
            gasData = await getRes.json();
          }
        } else if (postRes.ok) {
          gasData = await postRes.json();
        }
        clearTimeout(timeoutId);

        if (gasData?.fileId) {
          driveFileId = gasData.fileId;
          webViewLink = gasData.webViewLink || `https://drive.google.com/file/d/${gasData.fileId}/view`;
          isCloudSynced = true;
          console.log(`File successfully synced to Google Drive via Apps Script: ${driveFileId}`);
        }
      } catch (gasErr: any) {
        clearTimeout(timeoutId);
        console.warn('Google Apps Script upload failed, saved to local mirror:', gasErr.message);
      }
    }

    return {
      googleDriveFileId: driveFileId,
      googleDriveFolderId: folderId,
      fileName: originalFileName,
      mimeType,
      fileSize: stats.size,
      fileHash,
      webViewLink,
      localStoragePath: destinationPath,
      isCloudSynced
    };
  }

  public async deleteFile(googleDriveFileId: string, localStoragePath?: string): Promise<boolean> {
    // 1. Delete local file mirror
    if (localStoragePath && fs.existsSync(localStoragePath)) {
      try {
        fs.unlinkSync(localStoragePath);
        console.log(`Deleted local file mirror: ${localStoragePath}`);
      } catch (err: any) {
        console.warn('Failed to delete local mirror file:', err.message);
      }
    }

    // 2. Delete Google Drive file if synced and client is initialized
    if (this.driveClient && googleDriveFileId && !googleDriveFileId.startsWith('gdrive-local-')) {
      try {
        await this.driveClient.files.delete({ fileId: googleDriveFileId });
        console.log(`Deleted file from Google Drive: ${googleDriveFileId}`);
      } catch (err: any) {
        console.warn(`Failed to delete file from Google Drive API (${googleDriveFileId}):`, err.message);
      }
    }

    return true;
  }

  private getMonthName(m: number): string {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[m - 1] || 'Bulan';
  }
}

export const googleDriveService = new GoogleDriveService();
