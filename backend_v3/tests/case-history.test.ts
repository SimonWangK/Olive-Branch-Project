import request from 'supertest';
import app from '../src'; 
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

let adminToken: string;
let caseId: number;

beforeAll(async () => {


  const adminUser = await prisma.user.create({
      data: {
        email: 'test-admin@example1.com',
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


  const createdCase = await prisma.case.create({
    data: {
      case_type: 'INSOLVENCY',
      jurisdiction: 'NSW',
      opened_at: new Date(),
      status: 'ACTIVE',
      version:1,
    },
  });
  caseId = createdCase.id;
});

afterAll(async () => {
  await prisma.caseHistory.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Case History API', () => {
  it('PATCH /cases/:id should update and write history', async () => {
    const current = await prisma.case.findUnique({ where: { id: caseId } });

    const res = await request(app)
      .patch(`/api/cases/${caseId}`)
      .set('Authorization', adminToken)
      .send({
        description: 'Updated description',
        version:current?.version,
      });

    expect(res.status).toBe(200);


    const history = await prisma.caseHistory.findMany({
      where: { case_id: caseId },
    });

    expect(history.length).toBeGreaterThan(0);
    expect(history[0].field).toBe('description');
    expect(history[0].new_value).toBe('Updated description');
  });

  it('GET /cases/:id/history should return audit trail', async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}/history`)
      .set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('field');
    expect(res.body[0]).toHaveProperty('old_value');
    expect(res.body[0]).toHaveProperty('new_value');
    expect(res.body[0]).toHaveProperty('changer');
  });
});
