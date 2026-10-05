import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './db/schema';
import { seedDatabase } from './db/seed';
import { populateSampleDataIfEmpty } from './db/sample-data-importer';
import apiRouter from './routes/api.router';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static route for serving mirrored files and generated PDF reports
const storageDir = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './storage');
app.use('/storage', express.static(storageDir));

// Serve production client build if exists
const clientDistDir = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
}

// Initialize Database & Seed
try {
  initializeSchema();
  seedDatabase();
  populateSampleDataIfEmpty().catch(err => {
    console.error('Sample data population error:', err);
  });
  console.log('Database initialized and verified successfully.');
} catch (dbErr) {
  console.error('Critical database initialization error:', dbErr);
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Laboratory Automated Reporting & Analytics System',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRouter);

// SPA fallback for Express 5
if (fs.existsSync(clientDistDir)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/storage')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(path.join(clientDistDir, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Terjadi kesalahan internal pada server.',
    stack: process.env.NODE_ENV === 'development' ? undefined : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
  console.log(`Google Drive Folder ID configured: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
});
