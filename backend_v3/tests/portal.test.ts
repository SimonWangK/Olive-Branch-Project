// tests/portal.test.ts
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src';

const prisma = new PrismaClient();

describe('Creditor Portal API', () => {
  let caseId: number;

  beforeAll(async () => {
    await prisma.$connect();

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

    await prisma.complianceItem.createMany({
      data: [
        {
          case_id: caseId,
          title: 'Mandatory Item 1',
          mandatory: true,
          due_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 
          status: 'PENDING',
        },
        {
          case_id: caseId,
          title: 'Mandatory Item 2',
          mandatory: true,
          due_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 
          status: 'DONE',
        },
        {
          case_id: caseId,
          title: 'Optional Item',
          mandatory: false,
          status: 'PENDING',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.complianceItem.deleteMany();
    await prisma.case.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // --------------------
  it('GET /cases/:id/portal - should return portal data with correct structure', async () => {
    const res = await request(app).get(`/api/cases/${caseId}/portal`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('case_id', caseId);
    expect(res.body).toHaveProperty('case_type', 'Insolvency');
    expect(res.body).toHaveProperty('jurisdiction', 'NSW');
    expect(res.body).toHaveProperty('status', 'ACTIVE');
    expect(res.body).toHaveProperty('compliance_percentage');
    expect(res.body).toHaveProperty('compliance_items');
    expect(Array.isArray(res.body.compliance_items)).toBe(true);
  });

  it('should compute compliance_percentage correctly', async () => {
    const res = await request(app).get(`/api/cases/${caseId}/portal`);

    expect(res.body.compliance_percentage).toBe(50);
  });

  it('should mark overdue items correctly', async () => {
    const res = await request(app).get(`/api/cases/${caseId}/portal`);
    const overdueItem = res.body.compliance_items.find(
      (item: any) => item.title === 'Mandatory Item 1'
    );
    expect(overdueItem.status).toBe('OVERDUE');

    const doneItem = res.body.compliance_items.find(
      (item: any) => item.title === 'Mandatory Item 2'
    );
    expect(doneItem.status).toBe('DONE');
  });

  it('should not expose sensitive fields', async () => {
    const res = await request(app).get(`/api/cases/${caseId}/portal`);
    res.body.compliance_items.forEach((item: any) => {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('due_at');

      expect(item).not.toHaveProperty('id');
      expect(item).not.toHaveProperty('case_id');
      expect(item).not.toHaveProperty('assignee_id');
    });
  });

  it('GET - non-existing case should return 404', async () => {
    const res = await request(app).get(`/api/cases/999999/portal`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('code', 'CASE_NOT_FOUND');
    expect(res.body).toHaveProperty('message', 'Case not found');
  });
});
