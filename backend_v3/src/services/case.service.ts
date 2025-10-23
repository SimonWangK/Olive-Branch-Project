// services/case.service.ts
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import dayjs from 'dayjs';
import { getTemplatesByCaseTypeAndJurisdiction } from './compliance-template.service';
import { getMoneySummary } from './money.service';
const prisma = new PrismaClient();

const CaseCreateSchema = z.object({
  case_type: z.string().min(1),
  jurisdiction: z.string().min(1),
  description: z.string().optional(),
  opened_at: z.string().datetime(),
  target_close: z.string().datetime().optional(),
});

interface ListCasesParams {
  pagination: {
    skip: number;
    take: number;
    current: number;
    pageSize: number;
  };
  filters?: {
    case_num?: string;
    case_type?: string;
    jurisdiction?: string;
  };
}


export async function listCases({ pagination, filters = {} }: ListCasesParams) {
  const { skip, take, current, pageSize } = pagination;
  const { case_num, case_type, jurisdiction } = filters;



  const whereClause: any = {};


  if (case_num) {
    whereClause.case_num = { contains: case_num };
  }
  

  if (case_type) {
    whereClause.case_type = { contains:case_type};
  }
  

  if (jurisdiction) {
    whereClause.jurisdiction = { contains:jurisdiction};
  }

  console.log('whereClause:', JSON.stringify(whereClause, null, 2));
  console.log('skip:', skip, 'take:', take);

  try {
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        skip,
        take,
        where: whereClause,
        include: {
          compliance_items: true,
          tasks: true,
        },
        orderBy: { opened_at: 'desc' },
      }),
      prisma.case.count({ where: whereClause }),
    ]);

    const formattedCases = cases.map((caseItem) => ({
      ...caseItem,
      opened_at: dayjs(caseItem.opened_at).format('YYYY-MM-DD HH:mm:ss'),
      target_close: caseItem.target_close
        ? dayjs(caseItem.target_close).format('YYYY-MM-DD HH:mm:ss')
        : null,
    }));

    return {
      code: 2000,
      details: formattedCases,
      pagination: {
        total,
        current,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error('Prisma query error:', error);
    throw error;
  }
}





export async function createCase(data: unknown) {
  const parsed = CaseCreateSchema.parse(data);
  const { case_type, jurisdiction, description, opened_at, target_close } = parsed;

  // 格式化日期时间为 YYYYMMDD-HHMMSS
  const now = new Date();
  const formattedDateTime = now
    .toISOString()
    .replace(/[-:T]/g, '') // 移除 -、: 和 T
    .slice(0, 14); // 取 YYYYMMDDHHMMSS
  // const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  const case_num = `CASE${formattedDateTime}`;



  const openedDate = new Date(opened_at);

  // 从模板获取该 case_type 和 jurisdiction 的默认合规包
  const templates = await getTemplatesByCaseTypeAndJurisdiction(
    case_type,
    jurisdiction
  );

  // 根据模板生成 compliance items
  const complianceItems = templates.map((template) => ({
    title: template.title,
    mandatory: template.mandatory,
    due_at: new Date(openedDate.getTime() + template.due_days * 24 * 60 * 60 * 1000),
    status: 'PENDING',
  }));

  // 如果没有找到模板，使用默认的兜底逻辑
  if (complianceItems.length === 0) {
    complianceItems.push(
      {
        title: `Statement of Affairs (${case_type})`,
        mandatory: true,
        due_at: new Date(openedDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      {
        title: `Tax Filing (${jurisdiction})`,
        mandatory: true,
        due_at: new Date(openedDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      }
    );
  }

  // 生成默认任务
  const tasks = getDefaultTasks(case_type, jurisdiction, openedDate);

  return prisma.case.create({
    data: {
      case_num,
      case_type,
      jurisdiction,
      description,
      opened_at: openedDate,
      target_close: target_close ? new Date(target_close) : null,
      status: 'ACTIVE',
      compliance_items: {
        create: complianceItems,
      },
      tasks: {
        create: tasks,
      },
      financials: {  
        create: {
          budget_cents: 0,  
          write_off_cents: 0,
          balance_due: 0,
        },
      },
    },
    include: {
      compliance_items: true,
      tasks: true,
      financials: true, 
    },
  });
}

// 
function getDefaultTasks(case_type: string, jurisdiction: string, openedDate: Date) {
  return [
    {
      title: `default task about (${case_type}) , (${jurisdiction}) ,description:xxx`,
      due_at: new Date(openedDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      status: 'TODO',
    },
    // {
    //   title: `default task about (${jurisdiction}) , xxx`,
    //   due_at: new Date(openedDate.getTime() + 5 * 24 * 60 * 60 * 1000),
    //   status: 'TODO',
    // },
  ];
}

export async function closeCase(caseId: number) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      compliance_items: true,
      financials: true,
    },
  });

  if (!caseData) {
    throw { code: 'CASE_NOT_FOUND', message: 'Case not found' };
  }

  const incompleteMandatory = caseData.compliance_items.some(
    (item) => item.mandatory && item.status !== 'DONE'
  );
  if (incompleteMandatory) {
    throw {
      code: 'CLOSURE_BLOCKED',
      message: 'Mandatory compliance items incomplete',
    };
  }

  if (caseData.financials?.balance_due && caseData.financials.balance_due > 0) {
    throw {
      code: 'CLOSURE_BLOCKED',
      message: 'Balance due must be zero',
    };
  }

  return prisma.case.update({
    where: { id: caseId },
    data: {
      status: 'CLOSED',
      updated_at: new Date(),
    },
  });
}
const CaseUpdateSchema = z.object({
  case_type: z.string().min(1).optional(),
  jurisdiction: z.string().min(1).optional(),
  description: z.string().optional(),
  opened_at: z.string().datetime().optional(),
  target_close: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED']).optional(),
  version: z.number().int(),
});



export async function updateCase(caseId: number, data: unknown, userId: number) {
  const parsed = CaseUpdateSchema.parse(data);

  const currentCase = await prisma.case.findUnique({
    where: { id: caseId },
  });
  
  if (!currentCase) {
    throw { code: 'CASE_NOT_FOUND', message: 'Case not found' };
  }
  
  if (currentCase.version !== parsed.version) {
    throw {
      code: 'CONFLICT',
      message: 'Case version mismatch',
      status: 409,
    };
  }

  // Generate history entries only for fields that are actually updated
  const historyEntries = Object.entries(parsed)
    .filter(([key, new_value]) => 
      key !== 'version' && parsed[key as keyof typeof parsed] !== undefined &&
      (String((currentCase as any)[key]) !== String(new_value)) // Check if the value actually changed
    )
    .map(([field, new_value]) => ({
      case_id: caseId,
      changed_by: userId,
      changed_at: new Date(),
      field,
      old_value: String((currentCase as any)[field] || ''),
      new_value: String(new_value),
    }));

  // If there are changes, update case and create history entries
  const transactionData = [
    prisma.case.update({
      where: { id: caseId },
      data: {
        ...parsed,
        opened_at: parsed.opened_at ? new Date(parsed.opened_at) : undefined,
        target_close: parsed.target_close ? new Date(parsed.target_close) : undefined,
        version: { increment: 1 },
        updated_at: new Date(),
      },
    }),
    ...historyEntries.map((entry) =>
      prisma.caseHistory.create({ data: entry })
    ),
  ];

  return prisma.$transaction(transactionData);
}





export async function getCaseHistory(caseId: number) {
  return prisma.caseHistory.findMany({
    where: { case_id: caseId },
    orderBy: { changed_at: 'desc' },
    include: {
      changer: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}



export async function getCaseDetail(caseId: number) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      compliance_items: {
        select: {
          id: true,
          title: true,
          mandatory: true,
          due_at: true,
          status: true,
          document_id: true,
          document: {
            select: {
              id: true,
              title: true,
              versions: {
                select: {
                  id: true,
                  version_no: true,
                  url: true,
                  approved_at: true,
                },
              },
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          due_at: true,
          status: true,
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      },
      documents: {
        select: {
          id: true,
          title: true,
          versions: {
            select: {
              id: true,
              version_no: true,
              url: true,
              approved_at: true,
            },
            orderBy: { version_no: 'desc' },
          },
        },
      },
      history: {
        select: {
          id: true,
          field: true,
          old_value: true,
          new_value: true,
          changed_at: true,
          changer: { select: { id: true, name: true } },
        },
        orderBy: { changed_at: 'desc' },
      },
    },
  });

  if (!caseData) {
    throw { code: 'CASE_NOT_FOUND', message: 'Case not found', status: 404 };
  }

  // Fetch financial summary using getMoneySummary
  const financialSummary = await getMoneySummary(caseId);

  // Calculate progress
  const totalItems = caseData.compliance_items.length + caseData.tasks.length;
  const completedItems =
    caseData.compliance_items.filter((item) => item.status === 'DONE').length +
    caseData.tasks.filter((task) => task.status === 'DONE').length;
  const progress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  // Format compliance items
  const compliancePacks = caseData.compliance_items.map((item) => ({
    id: item.id,
    name: item.title,
    uploadDate: item.document?.versions[0]?.approved_at
      ? dayjs(item.document.versions[0].approved_at).format('YYYY-MM-DD')
      : item.due_at
      ? dayjs(item.due_at).format('YYYY-MM-DD')
      : dayjs(caseData.opened_at).format('YYYY-MM-DD'),
    status: item.status.toLowerCase(),
  }));

  // Format case files (non-compliance documents)
  const caseFiles = caseData.documents
    .filter((doc) => !caseData.compliance_items.some((item) => item.document_id === doc.id))
    .map((doc) => ({
      id: doc.id,
      name: doc.title,
      uploadDate: doc.versions[0]?.approved_at
        ? dayjs(doc.versions[0].approved_at).format('YYYY-MM-DD')
        : dayjs(caseData.opened_at).format('YYYY-MM-DD'),
      size: 'N/A',
      versions: doc.versions.map((v) => ({
        id: v.id,
        version_no: v.version_no,
        url: v.url,
        approved_at: v.approved_at,
      })),
    }));

  // Format version history
  const versions = caseData.history.map((entry, index) => ({
    version: `v${caseData.version - index}`,
    date: dayjs(entry.changed_at).format('YYYY-MM-DD'),
    description: `${entry.field} changed from "${entry.old_value || 'N/A'}" to "${entry.new_value || 'N/A'}"`,
    user: entry.changer.name,
  }));

  // Format financial status using getMoneySummary
  const financialStatus = {
    totalBudget: financialSummary.budget_cents / 100,
    spent: financialSummary.actual_spend_cents / 100,
    pending: 0, // Adjust if you have a way to calculate pending amounts
    remaining: financialSummary.balance_due_cents / 100,
  };

  return {
    code: 2000,
    data: {
      case_num: caseData.case_num,
      case_type: caseData.case_type,
      jurisdiction: caseData.jurisdiction,
      description: caseData.description || '',
      status: caseData.status,
      opened_at: dayjs(caseData.opened_at).format('YYYY-MM-DD'),
      target_close: caseData.target_close
        ? dayjs(caseData.target_close).format('YYYY-MM-DD')
        : '',
      updated_at: dayjs(caseData.updated_at).format('YYYY-MM-DD'),
      progress,
      compliancePacks,
      caseFiles,
      versions,
      financialStatus,
    },
  };
}

export async function getDashboardStats() {
  const [
    totalCases,
    totalTasks,
    totalCreditors,
    complianceItems,
    caseTypes,
  ] = await Promise.all([
    prisma.case.count(),
    prisma.task.count(),
    prisma.payment.count({ where: { method: 'OTHER' } }),
    prisma.complianceItem.findMany({
      select: { status: true },
    }),
    prisma.case.groupBy({
      by: ['case_type'],
      _count: { case_type: true },
    }),
  ]);

  const totalComplianceItems = complianceItems.length;
  const completedComplianceItems = complianceItems.filter(
    (item) => item.status === 'DONE'
  ).length;
  const complianceRate = totalComplianceItems
    ? Math.round((completedComplianceItems / totalComplianceItems) * 100)
    : 0;

  const caseTypeDistribution = caseTypes.map((type) => ({
    name: type.case_type,
    value: Math.round((type._count.case_type / totalCases) * 100) || 0,
    color: getCaseTypeColor(type.case_type),
  }));

  return {
    code: 2000,
    data: {
      totalCases,
      totalTasks,
      totalCreditors,
      complianceRate,
      caseTypeDistribution,
      activeCases: await getActiveCasesSummary(),
      recentTasks: await getRecentTasks(),
    },
  };
}

// Helper function to assign colors to case types
function getCaseTypeColor(caseType: string): string {
  const colors: { [key: string]: string } = {
    Bankruptcy: '#1890ff',
    Liquidation: '#52c41a',
    Restructuring: '#faad14',
  };
  return colors[caseType] || '#d9d9d9';
}

// Helper function to get active cases summary
async function getActiveCasesSummary() {
  const activeCases = await prisma.case.findMany({
    where: { status: 'ACTIVE' },
    include: { tasks: true },
    take: 3, // Limit to top 3 for dashboard
    orderBy: { opened_at: 'desc' },
  });

  return activeCases.map((caseItem) => {
    const totalTasks = caseItem.tasks.length;
    const tasksCompleted = caseItem.tasks.filter(
      (task) => task.status === 'DONE'
    ).length;
    const progress = totalTasks ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    return {
      id: caseItem.case_num,
      name: `${caseItem.case_type} Case ${caseItem.case_num}`,
      type: caseItem.case_type,
      jurisdiction: caseItem.jurisdiction,
      tasksCompleted,
      totalTasks,
      progress,
    };
  });
}

// Helper function to get recent tasks
async function getRecentTasks() {
  const tasks = await prisma.task.findMany({
    take: 3, // Limit to top 3 for dashboard
    orderBy: { created_at: 'desc' },
    include: {
      assignee: { select: { name: true, avatar: true } },
      case: { select: { case_type: true, case_num: true } },
    },
  });

  return tasks.map((task) => ({
    id: task.id.toString(),
    assignee: task.assignee?.name || 'Unassigned',
    assigneeAvatar: task.assignee?.avatar || 'https://via.placeholder.com/40',
    case: `${task.case.case_type} Case ${task.case.case_num}`,
    dueDate: dayjs(task.due_at).format('YYYY-MM-DD HH:mm'),
    status: task.status === 'DONE' ? 'confirmed' : 'pending',
  }));
}