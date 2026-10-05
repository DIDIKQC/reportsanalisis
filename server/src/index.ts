import path from 'path';
import fs from 'fs';
import { app } from './app';

const PORT = process.env.PORT || 5000;

// Serve production client build if exists
const clientDistDir = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(app.get('env') === 'production' ? (req, res, next) => next() : (req, res, next) => next());
  // SPA fallback for Express
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/storage') && !req.path.startsWith('/health')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const indexPath = path.join(clientDistDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    next();
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
  console.log(`Google Drive Folder ID configured: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
});
