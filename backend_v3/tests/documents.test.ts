// tests/documents.test.ts
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '../src';

const prisma = new PrismaClient();

describe('Documents API', () => {
  let caseId: number;
  let docId: number;
  let versionId: number;
  let adminToken: string;

  beforeAll(async () => {
    await prisma.$connect();



        const adminUser = await prisma.user.create({
            data: {
            email: 'test-admin@example5.com',
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
  });

  afterAll(async () => {
    await prisma.documentVersion.deleteMany();
    await prisma.document.deleteMany();
    await prisma.case.deleteMany({
      where: { id: caseId },
    });
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('POST /cases/:id/documents - create document', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/documents`)
      .set('Authorization', adminToken)
      .set('Content-Type', 'application/json')
      .send({ title: 'Test Doc' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    docId = res.body.id;
  });

  it('POST /cases/:id/documents/:documentId/versions - upload version', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/documents/${docId}/versions`)
      .set('Authorization', adminToken)
      .set('Content-Type', 'application/json')
      .send({ url: 'https://fake-url.com/file.pdf' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('version_no', 1);
    versionId = res.body.id;
  });

  it('POST /cases/:id/documents/versions/:versionId/approve - approve version', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/documents/versions/${versionId}/approve`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('approved_by');
    expect(res.body).toHaveProperty('approved_at');
  });

  it('GET /cases/:id/documents - list documents with versions', async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}/documents`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('versions');
    expect(res.body[0].versions[0]).toHaveProperty('approved_at');
  });
});
