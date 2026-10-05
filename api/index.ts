import { app, ensureDatabaseReady } from '../server/src/app';

export default function handler(req: any, res: any) {
  try {
    ensureDatabaseReady();
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('Vercel serverless execution error:', err);
    res.status(500).json({
      error: err.message || 'Internal server error in serverless function',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
