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

export const app = express();

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-View-As-User']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static route for serving mirrored files and generated PDF reports
const storageDir = process.env.VERCEL
  ? '/tmp/storage'
  : path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './storage');

if (!fs.existsSync(storageDir)) {
  try {
    fs.mkdirSync(storageDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create storage directory:', err);
  }
}
app.use('/storage', express.static(storageDir));

// Initialize Database & Seed
let isDbInitialized = false;
export function ensureDatabaseReady() {
  if (isDbInitialized) return;
  try {
    initializeSchema();
    seedDatabase();
    populateSampleDataIfEmpty().catch(err => {
      console.error('Sample data population error:', err);
    });
    isDbInitialized = true;
    console.log('Database initialized and verified successfully.');
  } catch (dbErr) {
    console.error('Critical database initialization error:', dbErr);
  }
}

// Auto-run DB initialization
ensureDatabaseReady();

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Laboratory Automated Reporting & Analytics System',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Laboratory Automated Reporting & Analytics System (Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
});

// API Routes (mount at /api and also root for serverless path flexibility)
app.use('/api', apiRouter);
app.use(apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Terjadi kesalahan internal pada server.',
    stack: process.env.NODE_ENV === 'development' ? undefined : undefined
  });
});

export default app;
