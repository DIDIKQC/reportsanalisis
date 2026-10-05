import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_lab_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    fullName: string;
  };
  tenantId?: string | null; // ID of the scoped tenant (null = all data for Superadmin)
  isViewAs?: boolean;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let tokenUser: any = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      tokenUser = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Sesi otentikasi telah kadaluarsa. Silakan login kembali.' });
    }
  } else {
    // Development fallback default: admin (superadmin)
    tokenUser = {
      id: 'usr-admin',
      username: 'admin',
      role: 'superadmin',
      fullName: 'Admin Utama'
    };
  }

  req.user = tokenUser;

  // Determine Tenant Scoping
  const viewAsHeader = (req.headers['x-view-as-user'] || req.query.viewAs) as string;
  const isSuperAdmin = (tokenUser.role || '').toLowerCase().replace(/[-_]/g, '') === 'superadmin';

  if (isSuperAdmin) {
    if (viewAsHeader && viewAsHeader !== 'ALL' && viewAsHeader !== '') {
      req.tenantId = viewAsHeader;
      req.isViewAs = true;
    } else {
      req.tenantId = null; // Full aggregate access across all tenants
      req.isViewAs = false;
    }
  } else {
    // Normal users are strictly isolated to their own tenant/user ID
    req.tenantId = tokenUser.id;
    req.isViewAs = false;
  }

  return next();
};

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Akses ditolak. Silakan login.' });
    }
    const cleanUserRole = (req.user.role || '').toLowerCase().replace(/[-_]/g, '');
    const isSuperAdmin = cleanUserRole === 'superadmin';
    const isAllowed = isSuperAdmin || allowedRoles.some(r => {
      const cleanR = r.toLowerCase().replace(/[-_]/g, '');
      return cleanR === cleanUserRole;
    });

    if (isAllowed) {
      return next();
    }
    return res.status(403).json({ error: 'Akses ditolak. Tindakan ini hanya dapat diakses oleh Superadmin.' });
  };
};
