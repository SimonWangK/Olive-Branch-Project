import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { TaskCreateSchema, TaskUpdateSchema } from '@/services/tasks.service';
import { createTask, getTasks, updateTask, deleteTask } from '@/services/tasks.service';
import { PrismaClient,  } from '@prisma/client';
import { pagination } from '@/middleware/pagination'; 

const router = Router({ mergeParams: true }); 
const prisma = new PrismaClient();


router.get('/', auth(['staff', 'admin','viewer']), pagination, async (req, res) => {
  const caseId = Number(req.params.id);
  const { pagination } = req as any; // Access pagination metadata
  try {
    const result = await getTasks(caseId, pagination);
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      code: 'LIST_TASKS_FAILED',
      message: 'Failed to fetch tasks',
      details: error,
    });
  }
});

router.get('/', auth(['staff', 'admin','viewer']), pagination, async (req, res) => {
  const caseId = Number(req.params.id);
  const { pagination } = req as any; 
  if (isNaN(caseId)) {
    return res.status(400).json({
      code: 'INVALID_CASE_ID',
      message: 'Case ID must be a number',
    });
  }
  try {
    const result = await getTasks(caseId, pagination);
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      code: 'LIST_TASKS_FAILED',
      message: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


// routes/tasks.ts

router.post(
  '/',
  auth(['staff', 'admin']),
  validate(TaskCreateSchema),
  async (req, res) => {
    const caseId = Number(req.params.id);
    const { assignee_id } = req.body;

    // Validate assignee_id exists if provided
    if (assignee_id) {
      const user = await prisma.user.findUnique({ where: { id: assignee_id } });
      if (!user) {
        return res.status(400).json({
          code: 'INVALID_ASSIGNEE_ID',
          message: 'Assignee ID does not exist',
        });
      }
    }

    try {
      const task = await createTask(caseId, req.body);
      res.status(201).json({
        code: 2000,
        message: 'created successfully',
        data: task,
      });
    } catch (error) {
      return res.status(500).json({
        code: 'CREATE_TASK_FAILED',
        message: 'Failed to create task',
        details: error,
      });
    }
  }
);


router.put(
  '/:taskId',
  auth(['staff', 'admin']),
  validate(TaskUpdateSchema),
  async (req, res) => {
    const taskId = Number(req.params.taskId);
    const { assignee_id } = req.body;

    // Validate assignee_id exists if provided
    if (assignee_id) {
      const user = await prisma.user.findUnique({ where: { id: assignee_id } });
      if (!user) {
        return res.status(400).json({
          code: 'INVALID_ASSIGNEE_ID',
          message: 'Assignee ID does not exist',
        });
      }
    }

    try {
      const task = await updateTask(taskId, req.body);
      res.status(201).json({
        code: 2000,
        message: 'updated successfully',
        data: task,
      });
    } catch (error) {
      return res.status(500).json({
        code: 'UPDATE_TASK_FAILED',
        message: 'Failed to update task',
        details: error,
      });
    }
  }
);

// delete Task
router.delete('/:taskId', auth(['admin']), async (req, res) => {
  const caseId = Number(req.params.id);
  const taskId = Number(req.params.taskId);

  if (isNaN(taskId)) {
    return res.status(400).json({ code: 'INVALID_TASK_ID', message: 'Task ID must be a number' });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.case_id !== caseId) {
    return res.status(404).json({ code: 'TASK_NOT_FOUND', message: 'Task not found in this case' });
  }

  await prisma.task.delete({ where: { id: taskId } });

  res.status(200).json({
    code: 2000,
    message: 'deleted successfully',
    data: null,
  });
});

export default router;
