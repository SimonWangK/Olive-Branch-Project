
// tests/tasks.test.ts
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src';

import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
let adminToken: string;

let staffToken: string;

describe('Tasks API', () => {
  let caseId: number;
  let taskId: number;

  beforeAll(async () => {
    await prisma.$connect();


        const adminUser = await prisma.user.create({
            data: {
            email: 'test-admin@example8.com',
            name: 'Test Admin',
            role: 'admin',
            password: 'test_password', 
            },
        });


        adminToken = 'Bearer ' + jwt.sign(
            { id: adminUser.id, role: adminUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
            );

        const staffUser = await prisma.user.create({
            data: {
            email: 'test-staff@example.com',
            name: 'Test staff',
            role: 'staff',
            password: 'test_password', 
            },
        });
    

        staffToken =
            'Bearer ' +
            jwt.sign(
            { id: staffUser.id, role: staffUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
            );        


    const testCase = await prisma.case.create({
      data: {
        case_type: 'Insolvency',
        jurisdiction: 'NSW',
        opened_at: new Date(),
        target_close: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    });
    caseId = testCase.id;


    const testTask = await prisma.task.create({
      data: {
        case_id: caseId,
        title: 'Overdue Task',
        due_at: new Date(Date.now() - 24 * 60 * 60 * 1000), 
        status: 'TODO',
      },
    });
    taskId = testTask.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.case.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // --------------------
  it('GET /cases/:id/tasks - should return tasks with computed OVERDUE status', async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}/tasks`)
      .set('Authorization', staffToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('status', 'OVERDUE'); 
  });

  // --------------------
  it('POST /cases/:id/tasks - should create a new task', async () => {
    const payload = { title: 'New Task', due_at: new Date().toISOString() };
    const res = await request(app)
      .post(`/api/cases/${caseId}/tasks`)
      .set('Authorization', staffToken)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('New Task');
    expect(res.body.status).toBe('TODO');
  });

  it('POST - missing title should return 400', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/tasks`)
      .set('Authorization', staffToken)
      .send({ due_at: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // --------------------
  it('PATCH /cases/:id/tasks/:taskId - should update a task', async () => {
    const payload = { status: 'DONE' };
    const res = await request(app)
      .patch(`/api/cases/${caseId}/tasks/${taskId}`)
      .set('Authorization', staffToken)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'DONE');

    const updated = await prisma.task.findUnique({ where: { id: taskId } });
    expect(updated?.status).toBe('DONE');
  });

  it('PATCH - invalid status should return 400', async () => {
    const res = await request(app)
      .patch(`/api/cases/${caseId}/tasks/${taskId}`)
      .set('Authorization', staffToken)
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // --------------------
  it('DELETE /cases/:id/tasks/:taskId - should delete task', async () => {

    const task = await prisma.task.create({
      data: { case_id: caseId, title: 'Delete Me', due_at: new Date() },
    });

    const res = await request(app)
      .delete(`/api/cases/${caseId}/tasks/${task.id}`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(204);

    const deleted = await prisma.task.findUnique({ where: { id: task.id } });
    expect(deleted).toBeNull();
  });

  it('DELETE - non-existent task should return 404', async () => {
    const res = await request(app)
      .delete(`/api/cases/${caseId}/tasks/999999`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('code', 'TASK_NOT_FOUND');
  });
});
