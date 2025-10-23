// routes/compliance-template.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import {
  createComplianceTemplate,
  listComplianceTemplates,
  getComplianceTemplate,
  updateComplianceTemplate,
  deleteComplianceTemplate,
  // seedDefaultTemplates,
} from '@/services/compliance-template.service';
import { pagination } from '@/middleware/pagination'; 

const router = Router();

// 
const ComplianceTemplateCreateSchema = z.object({
  case_type: z.string().min(1),
  jurisdiction: z.string().min(1),
  title: z.string().min(1),
  mandatory: z.boolean().optional(),
  due_days: z.number().int().min(0),
});

const ComplianceTemplateUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  mandatory: z.boolean().optional(),
  due_days: z.number().int().min(0).optional(),
});

// GET /compliance-templates -
router.get(
  '/',
  auth(['admin', 'staff', ]),
  pagination, 
  async (req, res) => {
    try {
      const { pagination } = req as any; // Access pagination metadata
      const { case_type, jurisdiction } = req.query;
      
      const filters: any = {};
      if (case_type) filters.case_type = String(case_type);
      if (jurisdiction) filters.jurisdiction = String(jurisdiction);
      
      const { templates,totalCount } = await listComplianceTemplates(filters, pagination);
      
      // 
      res.json({
        code: 2000,
        data: templates,
        total: totalCount,
        pagination: {
          totalCount: totalCount,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
        },
      }); 
    } catch (error) {
      return res.status(500).json({
        code: 'LIST_TEMPLATES_FAILED',
        message: 'Failed to fetch compliance templates',
        details: error,
      });
    }
  }
);

// GET /compliance-templates/:id 
router.get(
  '/:id',
  auth(['admin', 'staff', 'viewer']),
  async (req, res) => {
    try {
      const template = await getComplianceTemplate(Number(req.params.id));
      res.json({
        code: 2000,
        data: template,
      });
    } catch (error: any) {
      if (error.code === 'TEMPLATE_NOT_FOUND') {
        return res.status(404).json({
          code: error.code,
          message: error.message,
        });
      }
      return res.status(500).json({
        code: 'GET_TEMPLATE_FAILED',
        message: 'Failed to fetch compliance template',
        details: error,
      });
    }
  }
);

// POST /compliance-templates - 
router.post(
  '/',
  auth(['admin']),
  validate(ComplianceTemplateCreateSchema),
  async (req, res) => {
    try {
      const template = await createComplianceTemplate(req.body);
      res.status(201).json({
        code: 2000,
        data: template,
        message: 'Compliance template created successfully',
      });
    } catch (error: any) {
      // 
      if (error.code === 'P2002') {
        return res.status(409).json({
          code: 'DUPLICATE_TEMPLATE',
          message: 'A template with this case_type, jurisdiction, and title already exists',
          details: error,
        });
      }
      return res.status(500).json({
        code: 'CREATE_TEMPLATE_FAILED',
        message: 'Failed to create compliance template',
        details: error,
      });
    }
  }
);


// PUT /compliance-templates/:id - 
router.put(
  '/:id',
  auth(['admin']),
  validate(ComplianceTemplateUpdateSchema),
  async (req, res) => {
    try {
      const template = await updateComplianceTemplate(
        Number(req.params.id),
        req.body
      );
      res.json({
        code: 2000,
        data: template,
        message: 'Compliance template updated successfully',
      });
    } catch (error: any) {
      if (error.code === 'TEMPLATE_NOT_FOUND') {
        return res.status(404).json({
          code: error.code,
          message: error.message,
        });
      }
      return res.status(500).json({
        code: 'UPDATE_TEMPLATE_FAILED',
        message: 'Failed to update compliance template',
        details: error,
      });
    }
  }
);


// DELETE /compliance-templates/:id -
router.delete(
  '/:id',
  auth(['admin']),
  async (req, res) => {
    try {
      await deleteComplianceTemplate(Number(req.params.id));
      res.json({
        code: 2000,
        data: null,
        message: 'Compliance template deleted',
      });
    } catch (error: any) {
      if (error.code === 'TEMPLATE_NOT_FOUND') {
        return res.status(404).json({
          code: error.code,
          message: error.message,
        });
      }
      return res.status(500).json({
        code: 'DELETE_TEMPLATE_FAILED',
        message: 'Failed to delete compliance template',
        details: error,
      });
    }
  }
);

// POST /compliance-templates/seed - 
// router.post(
//   '/seed',
//   auth(['admin']),
//   async (req, res) => {
//     try {
//       const result = await seedDefaultTemplates();
//       res.json({
//         code: 2000,
//         data: result,
//         message: 'Default templates seeded successfully',
//       });
//     } catch (error) {
//       return res.status(500).json({
//         code: 'SEED_TEMPLATES_FAILED',
//         message: 'Failed to seed default templates',
//         details: error,
//       });
//     }
//   }
// );

export default router;