import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

import * as authCtrl from '../controllers/auth.controller';
import * as uploadCtrl from '../controllers/upload.controller';
import * as dashCtrl from '../controllers/dashboard.controller';
import * as reportCtrl from '../controllers/report.controller';
import * as filesCtrl from '../controllers/files.controller';
import * as aiCtrl from '../controllers/ai.controller';
import * as masterCtrl from '../controllers/master.controller';

const router = Router();

// Auth routes
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.get('/auth/me', authenticate, authCtrl.getMe);

// Upload routes
router.post('/upload/preview', authenticate, uploadMiddleware.single('file'), uploadCtrl.previewUpload);
router.post('/upload/confirm', authenticate, uploadMiddleware.single('file'), uploadCtrl.confirmImport);
router.get('/upload/history', authenticate, uploadCtrl.getUploadHistory);
router.get('/upload/errors/:batchId', authenticate, uploadCtrl.getBatchErrors);

// Dashboard & Analytics
router.get('/dashboard/summary', authenticate, dashCtrl.getDashboardSummary);
router.get('/dashboard/charts', authenticate, dashCtrl.getDashboardCharts);
router.get('/dashboard/filters', authenticate, dashCtrl.getDashboardFilterOptions);
router.get('/dashboard/drilldown', authenticate, dashCtrl.getDrilldown);

// Reports
router.get('/reports/types', authenticate, reportCtrl.getReportTypes);
router.get('/reports/annual', authenticate, reportCtrl.getAnnualReportData);
router.get('/reports/tat-evaluation', authenticate, reportCtrl.getTATEvaluationReport);
router.post('/reports/save', authenticate, reportCtrl.saveGeneratedReport);
router.get('/reports/history', authenticate, reportCtrl.getReportHistory);
router.delete('/reports/history/:id', authenticate, reportCtrl.deleteReportHistory);

// Raw Files Traceability
router.get('/files', authenticate, filesCtrl.listRawFiles);
router.get('/files/:id/download', authenticate, filesCtrl.downloadRawFile);
router.delete('/files/:id', authenticate, authorize(['superadmin']), filesCtrl.deleteRawFile);

// AI Insights & Recommendations
router.post('/ai/analyze', authenticate, aiCtrl.runAIAnalysis);
router.get('/ai/latest', authenticate, aiCtrl.getLatestAIAnalysis);

// Master Data & System
router.get('/master/units', authenticate, masterCtrl.getMasterUnits);
router.get('/master/tat-targets', authenticate, masterCtrl.getMasterTATTargets);
router.put('/master/tat-targets/:id', authenticate, masterCtrl.updateTATTarget);
router.get('/master/settings', authenticate, masterCtrl.getSystemSettings);
router.post('/master/settings', authenticate, masterCtrl.updateSystemSettings);
router.get('/master/audit', authenticate, masterCtrl.getAuditLogs);

// User Management (Strictly Superadmin Only)
router.get('/master/users', authenticate, authorize(['superadmin']), masterCtrl.getUsers);
router.post('/master/users', authenticate, authorize(['superadmin']), masterCtrl.createUser);
router.put('/master/users/:id', authenticate, authorize(['superadmin']), masterCtrl.updateUser);
router.put('/master/users/:id/password', authenticate, authorize(['superadmin']), masterCtrl.updateUserPassword);
router.delete('/master/users/:id', authenticate, authorize(['superadmin']), masterCtrl.deleteUser);

// User aliases for direct frontend access
router.get('/users', authenticate, authorize(['superadmin']), masterCtrl.getUsers);
router.post('/users', authenticate, authorize(['superadmin']), masterCtrl.createUser);
router.put('/users/:id', authenticate, authorize(['superadmin']), masterCtrl.updateUser);
router.put('/users/:id/password', authenticate, authorize(['superadmin']), masterCtrl.updateUserPassword);
router.delete('/users/:id', authenticate, authorize(['superadmin']), masterCtrl.deleteUser);

export default router;
