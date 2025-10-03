import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Create Prisma client instance to interact with the database
const prisma = new PrismaClient();

// Schema for validating "create case" request data
const CaseCreateSchema = z.object({
  case_type: z.string().min(1),         // case type must be non-empty
  jurisdiction: z.string().min(1),      // jurisdiction must be non-empty
  description: z.string().optional(),   // description is optional
  opened_at: z.string().datetime(),     // opening date (required, must be valid datetime)
  target_close: z.string().datetime().optional(), // optional target close date
});

// Service function to create a new case
export async function createCase(data: unknown) {
  // Validate incoming data against schema
  const parsed = CaseCreateSchema.parse(data);
  const { case_type, jurisdiction, description, opened_at, target_close } = parsed;

  // Generate default compliance items based on case type and jurisdiction
  const complianceItems = getDefaultComplianceItems(case_type, jurisdiction);

  // Generate default tasks based on case type and jurisdiction
  const tasks = getDefaultTasks(case_type, jurisdiction);

  // Create a new case record in the database
  return prisma.case.create({
    data: {
      case_type,
      jurisdiction,
      description,
      opened_at: new Date(opened_at),              // convert to Date object
      target_close: target_close ? new Date(target_close) : null,
      status: 'ACTIVE',                            // new cases start as ACTIVE
      compliance_items: {
        create: complianceItems,                   // attach compliance items
      },
      tasks: {
        create: tasks,                             // attach default tasks
      },
    },
    include: { compliance_items: true, tasks: true }, // return related data
  });
}

// Mock function: returns default compliance items depending on case type & jurisdiction
function getDefaultComplianceItems(case_type: string, jurisdiction: string) {
  return [
    {
      title: `Statement of Affairs (${case_type})`,
      mandatory: true,                                           // required item
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),    // due in 7 days
      status: 'PENDING',                                         // not done yet
    },
    {
      title: `Tax Filing (${jurisdiction})`,
      mandatory: true,                                           // required item
      due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),   // due in 14 days
      status: 'PENDING',
    },
  ];
}

// Mock function: returns default tasks depending on case type & jurisdiction
function getDefaultTasks(case_type: string, jurisdiction: string) {
  return [
    {
      title: `Review opening documents (${case_type})`,
      due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),    // due in 3 days
      status: 'TODO',
    },
    {
      title: `Initial meeting scheduled (${jurisdiction})`,
      due_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),    // due in 5 days
      status: 'TODO',
    },
  ];
}

// Service function to close a case
export async function closeCase(caseId: number) {
  // Fetch the case along with compliance items and financials
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: { compliance_items: true, financials: true },
  });

  // If no case found, throw error
  if (!caseData) {
    throw { code: 'CASE_NOT_FOUND', message: 'Case not found' };
  }

  // Check if any mandatory compliance items are incomplete
  const incompleteMandatory = caseData.compliance_items.some(
    item => item.mandatory && item.status !== 'DONE'
  );
  if (incompleteMandatory) {
    throw { code: 'CLOSURE_BLOCKED', message: 'Mandatory compliance items incomplete' };
  }

  // Check if financial balance due is greater than 0
  if (caseData.financials?.balance_due > 0) {
    throw { code: 'CLOSURE_BLOCKED', message: 'Balance due must be zero' };
  }

  // If all checks pass, close the case
  return prisma.case.update({
    where: { id: caseId },
    data: { status: 'CLOSED', updated_at: new Date() },
  });
}

// Schema for validating "update case" request data
const CaseUpdateSchema = z.object({
  case_type: z.string().min(1).optional(),
  jurisdiction: z.string().min(1).optional(),
  description: z.string().optional(),
  opened_at: z.string().datetime().optional(),
  target_close: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED']).optional(),
  version: z.number().int(), // used for optimistic concurrency control
});

// Service function to update an existing case
export async function updateCase(caseId: number, data: unknown, userId: number) {
  // Validate request against schema
  const parsed = CaseUpdateSchema.parse(data);

  // Fetch current case
  const currentCase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!currentCase) {
    throw { code: 'CASE_NOT_FOUND', message: 'Case not found' };
  }

  // Check version to avoid concurrent updates (optimistic locking)
  if (currentCase.version !== parsed.version) {
    throw { code: 'CONFLICT', message: 'Case version mismatch', status: 409 };
  }

  // Build case history entries for auditing changes
  const historyEntries = Object.entries(parsed)
    .filter(([key]) => key !== 'version' && parsed[key] !== undefined)
    .map(([field, new_value]) => ({
      case_id: caseId,
      changed_by: userId,
      changed_at: new Date(),
      field,
      old_value: String(currentCase[field] || ''),
      new_value: String(new_value),
    }));

  // Perform update + insert history entries in a single transaction
  return prisma.$transaction([
    prisma.case.update({
      where: { id: caseId },
      data: {
        ...parsed,
        opened_at: parsed.opened_at ? new Date(parsed.opened_at) : undefined,
        target_close: parsed.target_close ? new Date(parsed.target_close) : undefined,
        version: { increment: 1 },       // bump version
        updated_at: new Date(),
      },
    }),
    ...historyEntries.map(entry => prisma.caseHistory.create({ data: entry })),
  ]);
}




export async function getCaseHistory(caseId: number) {
  return prisma.caseHistory.findMany({
    where: { case_id: caseId },
    orderBy: { changed_at: 'desc' },
    include: {
      changer: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
