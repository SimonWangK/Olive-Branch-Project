import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '@/middleware/validator';
import { auth } from '@/middleware/auth';
import { getComplianceItems, updateComplianceItem, createComplianceItem } from '@/services/compliance.service';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /:caseId/compliance-items
 * Fetch all compliance items for a given case
 * - Only staff/admin can access
 */
router.get('/:caseId/compliance-items', auth(['staff', 'admin']), async (req, res) => {
  try {
    const items = await getComplianceItems(Number(req.params.caseId));
    res.json(items);
  } catch (error) {
    throw { code: 'FETCH_COMPLIANCE_FAILED', message: 'Failed to fetch compliance items', details: error };
  }
});

/**
 * PATCH /:caseId/compliance-items/:itemId
 * Update compliance item status (PENDING/DONE)
 * - Only staff/admin can update
 */
const ComplianceUpdateSchema = z.object({ status: z.enum(['PENDING', 'DONE']) });
router.patch(
  '/:caseId/compliance-items/:itemId',
  auth(['staff', 'admin']),
  validate(ComplianceUpdateSchema),
  async (req, res) => {
    try {
      const updated = await updateComplianceItem(Number(req.params.itemId), req.body);
      res.json(updated);
    } catch (error) {
      throw { code: 'UPDATE_COMPLIANCE_FAILED', message: 'Failed to update compliance item', details: error };
    }
  }
);

/**
 * POST /:caseId/compliance-items
 * Create a new compliance item for a case
 * - Only admin can create
 */
router.post('/:caseId/compliance-items', auth(['admin']), async (req, res) => {
  try {
    const newItem = await createComplianceItem(Number(req.params.caseId), req.body);
    res.status(201).json(newItem);
  } catch (error) {
    throw { code: 'CREATE_COMPLIANCE_FAILED', message: 'Failed to create compliance item', details: error };
  }
});

/**
 * DELETE /:caseId/compliance-items/:itemId
 * Delete a compliance item from a case
 * - Only admin can delete
 * - Validate that the item belongs to the given case
 */
router.delete('/:caseId/compliance-items/:itemId', auth(['admin']), async (req, res) => {
  const { caseId, itemId } = req.params;

  const item = await prisma.complianceItem.findUnique({ where: { id: Number(itemId) } });
  if (!item || item.case_id !== Number(caseId)) {
    return res.status(404).json({ code: 'ITEM_NOT_FOUND', message: 'Compliance item not found in this case' });
  }

  await prisma.complianceItem.delete({ where: { id: Number(itemId) } });
  res.status(204).send(); // No content
});

export default router;
