import { Router } from 'express';
import { createCase, closeCase, updateCase, getCaseHistory } from '@/services/case.service';
import { validate } from '@/middleware/validator';
import { z } from 'zod';
import { auth } from '@/middleware/auth';

const router = Router();

/**
 * POST /cases
 * Create a new case
 */
router.post(
  '/',
  auth(['admin', 'staff']), // Middleware: only admin/staff can create
  validate(z.object({
    case_type: z.string().min(1),
    jurisdiction: z.string().min(1),
    description: z.string().optional(),
    opened_at: z.string().datetime(),
    target_close: z.string().datetime().optional(),
  })), 
  async (req, res) => {
    try {
      const caseData = await createCase(req.body);
      res.status(201).json(caseData); // Return created case
    } catch (error) {
      throw { code: 'CASE_CREATION_FAILED', message: 'Failed to create case', details: error };
    }
  }
);

/**
 * POST /cases/:id/close
 * Close an existing case
 */
router.post('/:id/close', auth(['admin']), async (req, res) => {
  try {
    const caseData = await closeCase(Number(req.params.id));
    res.json(caseData); // Return closed case
  } catch (error: any) {
    if (error.code === 'CLOSURE_BLOCKED') {
      return res.status(403).json({ code: error.code, message: error.message });
    }
    if (error.code === 'CASE_NOT_FOUND') {
      return res.status(404).json({ code: error.code, message: error.message });
    }
    return res.status(500).json({ code: 'CASE_CLOSURE_FAILED', message: 'Failed to close case' });
  }
});

/**
 * PATCH /cases/:id
 * Update case details
 */
router.patch(
  '/:id',
  auth(['staff', 'admin']),
  validate(z.object({
    case_type: z.string().optional(),
    jurisdiction: z.string().optional(),
    description: z.string().optional(),
    opened_at: z.string().datetime().optional(),
    target_close: z.string().datetime().optional(),
    status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED']).optional(),
    version: z.number().int(), // optimistic locking
  })), 
  async (req, res) => {
    try {
      const caseData = await updateCase(Number(req.params.id), req.body, (req as any).user.id);
      res.json(caseData[0]); // Return updated case
    } catch (error) {
      throw { code: 'UPDATE_CASE_FAILED', message: 'Failed to update case', details: error };
    }
  }
);

/**
 * GET /cases/:id/history
 * Fetch case history (audit trail)
 */
router.get('/:id/history', auth(['staff', 'admin']), async (req, res) => {
  try {
    const history = await getCaseHistory(Number(req.params.id));
    res.json(history);
  } catch (error) {
    return res.status(500).json({ code: 'GET_HISTORY_FAILED', message: 'Failed to fetch case history' });
  }
});

export default router;
