import { PrismaClient, ComplianceItem } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Compute compliance item status dynamically
 * - If status is already 'DONE' → return DONE
 * - If due date has passed and not done → return OVERDUE
 * - Otherwise → return PENDING
 */
export function computeComplianceStatus(item: ComplianceItem) {
  const now = new Date();
  if (item.status === 'DONE') return 'DONE';
  if (item.due_at && item.due_at < now) return 'OVERDUE';
  return 'PENDING';
}

/**
 * Get all compliance items for a given case
 * - Fetch items from DB
 * - Recompute their status dynamically before returning
 */
export async function getComplianceItems(caseId: number) {
  const items = await prisma.complianceItem.findMany({ where: { case_id: caseId } });
  return items.map(item => ({ ...item, status: computeComplianceStatus(item) }));
}

/**
 * Schema validation for compliance item update
 */
const ComplianceUpdateSchema = z.object({
  status: z.enum(['PENDING', 'DONE']),
});

/**
 * Update compliance item (status only)
 * - Validate input
 * - Update in DB
 * - Return item with recalculated status
 */
export async function updateComplianceItem(id: number, data: unknown) {
  const parsed = ComplianceUpdateSchema.parse(data);
  const updated = await prisma.complianceItem.update({ where: { id }, data: parsed });
  return { ...updated, status: computeComplianceStatus(updated) };
}

/**
 * Schema validation for compliance item creation
 */
const ComplianceCreateSchema = z.object({
  title: z.string().min(1),
  mandatory: z.boolean().optional(),
  due_at: z.string().datetime().optional(),
});

/**
 * Create a new compliance item for a case
 * - Validate input
 * - Insert into DB
 * - Default status: PENDING
 */
export async function createComplianceItem(caseId: number, data: unknown) {
  const parsed = ComplianceCreateSchema.parse(data);
  const newItem = await prisma.complianceItem.create({
    data: {
      case_id: caseId,
      title: parsed.title,
      mandatory: parsed.mandatory ?? true, // default mandatory = true
      due_at: parsed.due_at ? new Date(parsed.due_at) : null,
      status: 'PENDING',
    },
  });
  return { ...newItem, status: computeComplianceStatus(newItem) };
}

/**
 * Delete compliance item
 * - Ensure the item belongs to the given case
 * - Delete if found
 */
export async function deleteComplianceItem(caseId: number, itemId: number) {
  const item = await prisma.complianceItem.findUnique({ where: { id: itemId } });
  if (!item || item.case_id !== caseId) {
    throw { code: 'ITEM_NOT_FOUND', message: 'Compliance item not found in this case' };
  }
  await prisma.complianceItem.delete({ where: { id: itemId } });
}

/**
 * Get portal data (summary for front-end dashboard)
 * - Fetch case with compliance items
 * - Compute compliance completion percentage
 * - Return simplified view with computed item statuses
 */
export async function getPortalData(caseId: number) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: { compliance_items: true },
  });

  if (!caseData) {
    throw {
      code: 'CASE_NOT_FOUND',
      message: 'Case not found',
    };
  }

  // Count total mandatory compliance items
  const totalMandatory = caseData.compliance_items.filter(
    (item) => item.mandatory
  ).length;

  // Count completed mandatory items
  const doneMandatory = caseData.compliance_items.filter(
    (item) => item.mandatory && item.status === 'DONE'
  ).length;

  // Calculate compliance percentage
  const compliancePercentage = totalMandatory
    ? (doneMandatory / totalMandatory) * 100
    : 100;

  return {
    case_id: caseData.id,
    case_type: caseData.case_type,
    jurisdiction: caseData.jurisdiction,
    status: caseData.status,
    compliance_percentage: compliancePercentage,
    compliance_items: caseData.compliance_items.map((item) => ({
      title: item.title,
      status:
        item.due_at && item.due_at < new Date() && item.status !== 'DONE'
          ? 'OVERDUE'
          : item.status,
      due_at: item.due_at,
    })),
  };
}
