import { PrismaClient } from '@prisma/client';
// import { TaskCreateSchema, TaskUpdateSchema } from '@/schemas/index.schema';
import { z } from 'zod';
import dayjs from 'dayjs';



export const TaskCreateSchema = z.object({
  title: z.string().min(1),
  assignee_id: z.number().int().positive().optional(), // Validate as positive integer
  due_at: z.string().datetime(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
});

export const TaskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  assignee_id: z.number().int().positive().optional(), // Validate as positive integer
  due_at: z.string().datetime().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
});

const prisma = new PrismaClient();

export async function createTask(caseId: number, data: unknown) {
  const parsed = TaskCreateSchema.parse(data);
  return prisma.task.create({
    data: { ...parsed, case_id: caseId },
  });
}




export async function getTasks(caseId: number, pagination: { skip: number; take: number }) {
  const { skip, take } = pagination;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: { case_id: caseId },
      skip,
      take,
      orderBy: { due_at: 'desc' },
      include: {
        assignee: {
          select: { id: true, name: true, username: true },
        },
      },
    }),
    prisma.task.count({ where: { case_id: caseId } }),
  ]);

  const formattedTasks = tasks.map(task => {
    let status = task.status;
    if (status !== 'DONE' && task.due_at && task.due_at < new Date()) {
      status = 'OVERDUE';
    }

    return {
      ...task,
      due_at: task.due_at ? dayjs(task.due_at).format('YYYY-MM-DD HH:mm:ss') : null,
      created_at: dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs(task.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      status,
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name, username: task.assignee.username } : null,
    };
  });

  return {
    code: 2000,
    details: formattedTasks,
    pagination: {
      total,
      current: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    },
  };
}



export async function updateTask(taskId: number, data: unknown) {
  const parsed = TaskUpdateSchema.parse(data);
  return prisma.task.update({ where: { id: taskId }, data: parsed });
}


export async function deleteTask(taskId: number) {
  return prisma.task.delete({ where: { id: taskId } });
}
