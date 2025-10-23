
// services/compliance-template.service.ts
import { PrismaClient, } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// 
const ComplianceTemplateCreateSchema = z.object({
  case_type: z.string().min(1),
  jurisdiction: z.string().min(1),
  title: z.string().min(1),
  mandatory: z.boolean().optional(),
  due_days: z.number().int().min(0), // 
});

// 
const ComplianceTemplateUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  mandatory: z.boolean().optional(),
  due_days: z.number().int().min(0).optional(),
});

// 
export async function createComplianceTemplate(data: unknown) {
  const parsed = ComplianceTemplateCreateSchema.parse(data);
  
  return prisma.compliancePackTemplate.create({
    data: {
      case_type: parsed.case_type,
      jurisdiction: parsed.jurisdiction,
      title: parsed.title,
      mandatory: parsed.mandatory ?? true,
      due_days: parsed.due_days,
    },
  });
}

// 
export async function listComplianceTemplates(filters?: {
  case_type?: string;
  jurisdiction?: string;
}, pagination?: { page: number; limit: number }) {
  const where: any = {};


  if (filters?.case_type) {
    where.case_type = filters.case_type;
  }

  if (filters?.jurisdiction) {
    where.jurisdiction = filters.jurisdiction;
  }

  // 
  const skip = pagination?.page && pagination?.limit ? (pagination.page - 1) * pagination.limit : 0;
  const take = pagination?.limit || 10;

  // 
  const templates = await prisma.compliancePackTemplate.findMany({
    where,
    skip,
    take,
    orderBy: [
      { case_type: 'asc' },
      { jurisdiction: 'asc' },
      { created_at: 'desc' },
    ],
  });

  // 
  const totalCount = await prisma.compliancePackTemplate.count({
    where,
  });

  return { templates, totalCount };
}

// 
export async function getComplianceTemplate(id: number) {
  const template = await prisma.compliancePackTemplate.findUnique({
    where: { id },
  });
  
  if (!template) {
    throw {
      code: 'TEMPLATE_NOT_FOUND',
      message: 'Compliance template not found',
    };
  }
  
  return template;
}

// 
export async function updateComplianceTemplate(id: number, data: unknown) {
  const parsed = ComplianceTemplateUpdateSchema.parse(data);
  
  await getComplianceTemplate(id);
  
  return prisma.compliancePackTemplate.update({
    where: { id },
    data: parsed,
  });
}

// 
export async function deleteComplianceTemplate(id: number) {
  // 
  await getComplianceTemplate(id);
  
  return prisma.compliancePackTemplate.delete({
    where: { id },
  });
}

//
export async function getTemplatesByCaseTypeAndJurisdiction(
  case_type: string,
  jurisdiction: string
) {
  return prisma.compliancePackTemplate.findMany({
    where: {
      case_type,
      jurisdiction,
    },
    orderBy: {
      created_at: 'asc',
    },
  });
}

// 
// export async function seedDefaultTemplates() {
//   const defaultTemplates = [
//     // Bankruptcy templates
//     {
//       case_type: 'BANKRUPTCY',
//       jurisdiction: 'NY',
//       title: 'Statement of Affairs',
//       mandatory: true,
//       due_days: 7,
//     },
//     {
//       case_type: 'BANKRUPTCY',
//       jurisdiction: 'NY',
//       title: 'Schedule of Assets',
//       mandatory: true,
//       due_days: 14,
//     },
//     {
//       case_type: 'BANKRUPTCY',
//       jurisdiction: 'NY',
//       title: 'Creditor Meeting Notice',
//       mandatory: true,
//       due_days: 21,
//     },
//     {
//       case_type: 'BANKRUPTCY',
//       jurisdiction: 'CA',
//       title: 'Statement of Affairs',
//       mandatory: true,
//       due_days: 10,
//     },
//     {
//       case_type: 'BANKRUPTCY',
//       jurisdiction: 'CA',
//       title: 'Tax Filing',
//       mandatory: true,
//       due_days: 30,
//     },
//     // Liquidation templates
//     {
//       case_type: 'LIQUIDATION',
//       jurisdiction: 'NY',
//       title: 'Asset Inventory',
//       mandatory: true,
//       due_days: 5,
//     },
//     {
//       case_type: 'LIQUIDATION',
//       jurisdiction: 'NY',
//       title: 'Liquidation Plan',
//       mandatory: true,
//       due_days: 15,
//     },
//     {
//       case_type: 'LIQUIDATION',
//       jurisdiction: 'CA',
//       title: 'Asset Inventory',
//       mandatory: true,
//       due_days: 7,
//     },
//     {
//       case_type: 'LIQUIDATION',
//       jurisdiction: 'CA',
//       title: 'Distribution Schedule',
//       mandatory: true,
//       due_days: 20,
//     },
//     // Restructuring templates
//     {
//       case_type: 'RESTRUCTURING',
//       jurisdiction: 'NY',
//       title: 'Restructuring Proposal',
//       mandatory: true,
//       due_days: 30,
//     },
//     {
//       case_type: 'RESTRUCTURING',
//       jurisdiction: 'NY',
//       title: 'Financial Statements',
//       mandatory: true,
//       due_days: 14,
//     },
//   ];

//   // 使用 createMany 批量插入，跳过已存在的记录
//   return prisma.compliancePackTemplate.createMany({
//     data: defaultTemplates,
//     skipDuplicates: true, // 跳过重复的记录（根据 unique 约束）
//   });
// }