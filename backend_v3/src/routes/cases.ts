import { Router } from 'express';
import {listCases, createCase,closeCase,updateCase,getCaseHistory,getDashboardStats,getCaseDetail} from '@/services/case.service';
import { validate } from '@/middleware/validator';
import { pagination } from '@/middleware/pagination'; 
import { z } from 'zod';
import { auth } from '@/middleware/auth';

const router = Router();



router.post(
    '/',
    auth(['admin', 'staff']),
    validate(z.object({
        case_type: z.string().min(1),
        jurisdiction: z.string().min(1),
        description: z.string().optional(),
        opened_at: z.string().datetime(),
        target_close: z.string().datetime().optional(),
    })), async (req, res) => {
    try {
        const caseData = await createCase(req.body);
        res.status(201).json(caseData);
    } catch (error) {
        throw { code: 'CASE_CREATION_FAILED', message: 'Failed to create case', details: error };
    }
});


router.get(
  '/stats',
  auth(['staff', 'admin', 'viewer']),
  async (req, res) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error) {
      return res.status(500).json({
        code: 'GET_STATS_FAILED',
        message: 'Failed to fetch dashboard statistics',
        details: error,
      });
    }
  }
);

router.get(
  '/',
  auth(['staff', 'admin', 'viewer']),
  pagination,
  async (req, res) => {
    try {
      console.log('=== Route Debug ===');
      console.log('req.query:', req.query);
      console.log('req.pagination:', (req as any).pagination);
      
      const { pagination } = req;
      const { case_num, case_type, jurisdiction } = req.query;
      
      const result = await listCases({
        pagination,
        filters: {
          case_num: case_num as string,
          case_type: case_type as string,
          jurisdiction: jurisdiction as string,
        },
      });
      res.json(result);
    } catch (error) {
      console.error('=== Route Error ===');
      console.error('Error details:', error);
      return res.status(500).json({
        code: 'LIST_CASES_FAILED',
        message: 'Failed to fetch cases',
        details: error,
      });
    }
  }
);

router.get(
  '/:id',
  auth(['staff', 'admin', 'viewer']),
  async (req, res) => {
    try {
      const caseDetail = await getCaseDetail(Number(req.params.id));
      res.json(caseDetail);
    } catch (error: any) {
      return res.status(error.status || 500).json({
        code: error.code || 'GET_CASE_DETAIL_FAILED',
        message: error.message || 'Failed to fetch case details',
        details: error.details || null,
      });
    }
  }
);





router.post('/:id/close', auth(['admin']), async (req, res) => {
  try {
    const caseData = await closeCase(Number(req.params.id));
    res.json({
      code: 2000,
      message: 'Case closed successfully',
      data: caseData,
    });
  } catch (error: any) {
    if (error.code === 'CLOSURE_BLOCKED') {
      return res.status(403).json({
        code: error.code,
        message: error.message,
        details: error.details || null,
      });
    }
    if (error.code === 'CASE_NOT_FOUND') {
      return res.status(404).json({
        code: error.code,
        message: error.message,
        details: error.details || null,
      });
    }
    return res.status(500).json({
      code: 'CASE_CLOSURE_FAILED',
      message: 'Failed to close case',
      details: error,
    });
  }
});






// PATCH /cases/:id update Case
router.put('/:id', auth(['staff', 'admin']), validate(z.object({
  case_type: z.string().optional(),
  jurisdiction: z.string().optional(),
  description: z.string().optional(),
  opened_at: z.string().datetime().optional(),
  target_close: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED']).optional(),
  version: z.number().int(),
})), async (req, res) => {
  try {
    const caseData = await updateCase(Number(req.params.id), req.body, (req as any).user.id);
    res.json(caseData[0]); // 
  } catch (error) {
    throw { code: 'UPDATE_CASE_FAILED', message: 'Failed to update case', details: error };
  }
});



// GET /cases/:id/history
router.get('/:id/history', auth(['staff', 'admin']), async (req, res) => {
  try {
    const history = await getCaseHistory(Number(req.params.id));
    res.json(history);
  } catch (error) {
    return res.status(500).json({
      code: 'GET_HISTORY_FAILED',
      message: 'Failed to fetch case history',
      details: error,
    });
  }
});




export default router;