import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '../src';

const prisma = new PrismaClient();

describe('Money API', () => {
  let caseId: number;
  let adminToken: string;

  beforeAll(async () => {
    await prisma.$connect();


    const adminUser = await prisma.user.create({
        data: {
        email: 'test-admin@example6.com',
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
      data: { case_type: 'Insolvency', jurisdiction: 'NSW', opened_at: new Date(), status: 'ACTIVE' }
    });
    caseId = testCase.id;

    await prisma.caseFinancial.create({ data: { case_id: caseId, budget_cents: 100000, write_off_cents: 0, balance_due: 0 } });
  });

  afterAll(async () => {
    await prisma.payment.deleteMany();
    await prisma.invoiceLine.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.caseFinancial.deleteMany();
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('GET /cases/:id/money/summary', async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}/money/summary`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('budget_cents');
    expect(res.body).toHaveProperty('balance_due_cents');
  });

  it('POST /cases/:id/money/time', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/money/time`)
      .set('Authorization', adminToken)
      .send({ date: new Date(), hours: 2.5, rate_cents: 5000, taxable: true, notes: 'Test work' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('POST /cases/:id/money/expenses', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/money/expenses`)
      .set('Authorization', adminToken)
      .send({ date: new Date(), description: 'Test expense', amount_cents: 2000, taxable: true, vendor: 'Vendor X' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
