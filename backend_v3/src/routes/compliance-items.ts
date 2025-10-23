import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '@/middleware/validator';
import { auth } from '@/middleware/auth';
import { getComplianceItems, updateComplianceItem, createComplianceItem, deleteComplianceItem } from '@/services/compliance.service';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// GET 
router.get('/:caseId/compliance-items', auth(['staff', 'admin']), async (req, res) => {
  try {
    const items = await getComplianceItems(Number(req.params.caseId));
    res.json({ code: 2000, message: "Fetched compliance items successfully", details: items });
  } catch (error) {
    res.status(500).json({ code: 'FETCH_COMPLIANCE_FAILED', message: 'Failed to fetch compliance items', details: error });
  }
});

// PATCH 
const ComplianceUpdateSchema = z.object({ status: z.enum(['PENDING', 'DONE']) });
router.put('/:caseId/compliance-items/:itemId', auth(['staff', 'admin']), validate(ComplianceUpdateSchema), async (req, res) => {
  try {
    const updated = await updateComplianceItem(Number(req.params.itemId), req.body);
    res.json({ code: 2000, message: "Compliance item updated successfully", details: updated });
  } catch (error) {
    res.status(500).json({ code: 'UPDATE_COMPLIANCE_FAILED', message: 'Failed to update compliance item', details: error });
  }
});

// POST 
router.post('/:caseId/compliance-items', auth(['admin']), async (req, res) => {
  try {
    const newItem = await createComplianceItem(Number(req.params.caseId), req.body);
    res.status(201).json({ code: 2000, message: "Compliance item created successfully", details: newItem });
  } catch (error) {
    res.status(500).json({ code: 'CREATE_COMPLIANCE_FAILED', message: 'Failed to create compliance item', details: error });
  }
});


// DELETE
router.delete('/:caseId/compliance-items/:itemId', auth(['admin']), async (req, res) => {
  const { caseId, itemId } = req.params;

  try {
    const item = await prisma.complianceItem.findUnique({ where: { id: Number(itemId) } });
    if (!item || item.case_id !== Number(caseId)) {
      return res.status(404).json({ code: 'ITEM_NOT_FOUND', message: 'Compliance item not found in this case' });
    }

    await prisma.complianceItem.delete({ where: { id: Number(itemId) } });
    res.status(200).json({ code: 2000, message: 'Compliance item deleted successfully', details: {} });
  } catch (error) {
    res.status(500).json({ code: 'DELETE_COMPLIANCE_FAILED', message: 'Failed to delete compliance item', details: error });
  }
});

export default router;
