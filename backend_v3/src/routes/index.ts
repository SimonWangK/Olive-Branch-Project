import { Express } from 'express';
import caseRoutes from './cases';
import complianceRoutes from './compliance-items';
import complianceTemplateRoutes from './compliance-template';
import portalRoutes from './portal';
import moneyRoutes from './money';
import authRoutes from './auth';
import taskRoutes from './tasks';
import documentRoutes from './documents'; 
import moneyRouter from './money';
import userRoutes from './user';

export function setupRoutes(app: Express) {
  app.use('/api/auth', authRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api/cases', complianceRoutes);
  app.use('/api/compliance_template', complianceTemplateRoutes);
  app.use('/api/cases', portalRoutes);
  app.use('/api/cases', moneyRoutes); 
  app.use('/api/cases/:id/tasks', taskRoutes);

  // Evidence Upload & Approvals
  app.use('/api/cases/:id/documents', documentRoutes);
  app.use('/api/cases/:id/money', moneyRouter);
  app.use('/api/user', userRoutes);
}
