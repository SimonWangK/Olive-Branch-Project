import { Express } from 'express';
import caseRoutes from './cases';
import complianceRoutes from './compliance-items';


export function setupRoutes(app: Express) {

  app.use('/api/cases', caseRoutes);
  app.use('/api/cases', complianceRoutes);

}
