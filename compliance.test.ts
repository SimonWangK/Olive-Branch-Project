import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
let adminToken: string;


describe('Compliance Items API', () => {
  let caseId: number;
  let itemId: number;

  beforeAll(async () => {
    await prisma.$connect();


        const adminUser = await prisma.user.create({
            data: {
            email: 'test-admin@example4.com',
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

    const testItem = await prisma.complianceItem.create({
      data: {
        case_id: caseId,
        title: 'Test Statement',
        mandatory: true,
        due_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
    });
    itemId = testItem.id;
  });

  afterAll(async () => {

    await prisma.complianceItem.deleteMany();
    await prisma.case.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // --------------------
  it('GET /cases/:id/compliance-items - should return compliance items with computed status', async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}/compliance-items`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('status', 'OVERDUE'); 
  });

  // --------------------
  it('PATCH /cases/:id/compliance-items/:itemId - should update status', async () => {
    const res = await request(app)
      .patch(`/api/cases/${caseId}/compliance-items/${itemId}`)
      .set('Authorization', adminToken)
      .send({ status: 'DONE' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'DONE');


    const updated = await prisma.complianceItem.findUnique({ where: { id: itemId } });
    expect(updated?.status).toBe('DONE');
  });

  it('PATCH - invalid status should return 400', async () => {
    const res = await request(app)
      .patch(`/api/cases/${caseId}/compliance-items/${itemId}`)
      .set('Authorization', adminToken)
      .send({ status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // --------------------
  it('POST /cases/:id/compliance-items - should create a new item', async () => {
    const payload = { title: 'New Item', mandatory: true };
    const res = await request(app)
      .post(`/api/cases/${caseId}/compliance-items`)
      .set('Authorization', adminToken)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('New Item');
    expect(res.body.status).toBe('PENDING');
  });

  it('POST - invalid payload (missing title) should return 400', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/compliance-items`)
      .set('Authorization', adminToken)
      .send({ mandatory: true });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // --------------------
  it('DELETE /cases/:id/compliance-items/:itemId - should delete item', async () => {

    const item = await prisma.complianceItem.create({
      data: { case_id: caseId, title: 'Delete Me', status: 'PENDING', mandatory: true },
    });

    const res = await request(app)
      .delete(`/api/cases/${caseId}/compliance-items/${item.id}`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(204);

    const deleted = await prisma.complianceItem.findUnique({ where: { id: item.id } });
    expect(deleted).toBeNull();
  });

  it('DELETE - item not in case should return 404', async () => {
    const res = await request(app)
      .delete(`/api/cases/${caseId}/compliance-items/999999`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('code', 'ITEM_NOT_FOUND');
  });
});
