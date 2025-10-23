import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
let adminToken: string;

describe('Closure Gate API', () => {
  let caseId: number;
  let mandatoryItemId: number;


  beforeAll(async () => {
    await prisma.$connect();


    const adminUser = await prisma.user.create({
        data: {
        email: 'test-admin@example3.com',
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
        status: 'ACTIVE',
      },
    });
    caseId = testCase.id;


    const item = await prisma.complianceItem.create({
      data: {
        case_id: caseId,
        title: 'Mandatory Statement',
        mandatory: true,
        status: 'PENDING', 
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });
    mandatoryItemId = item.id;
  });

  afterAll(async () => {
    await prisma.complianceItem.deleteMany();
    await prisma.case.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('POST /cases/:id/close - should block closure if mandatory items incomplete', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/close`)
      .set('Authorization', adminToken); 

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('code', 'CLOSURE_BLOCKED');
    expect(res.body).toHaveProperty('message', 'Mandatory compliance items incomplete');
  });

  it('POST /cases/:id/close - should close case if all mandatory items done', async () => {

    await prisma.complianceItem.update({
      where: { id: mandatoryItemId },
      data: { status: 'DONE' },
    });

    const res = await request(app)
      .post(`/api/cases/${caseId}/close`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', caseId);
    expect(res.body).toHaveProperty('status', 'CLOSED');
  });

  it('POST /cases/:id/close - non-existing case should return 404', async () => {
    const res = await request(app)
      .post('/api/cases/999999/close')
      .set('Authorization', adminToken);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('code', 'CASE_NOT_FOUND');
    expect(res.body).toHaveProperty('message', 'Case not found');
  });
});
