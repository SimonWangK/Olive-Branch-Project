// /server/tests/cases.test.ts
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src'; 
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
let adminToken: string;

describe('POST /cases', () => {

  beforeAll(async () => {
    await prisma.$connect();


    const adminUser = await prisma.user.create({
        data: {
        email: 'test-admin@example2.com',
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

    
    
  });

  afterAll(async () => {

    await prisma.task.deleteMany();
    await prisma.complianceItem.deleteMany();
    await prisma.case.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('happy path: should create a case with compliance items and tasks', async () => {
    const payload = {
      case_type: 'Insolvency',
      jurisdiction: 'NSW',
      opened_at: new Date().toISOString(),
      target_close: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Test case',
    };

    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', adminToken) //
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.compliance_items).toBeInstanceOf(Array);
    expect(res.body.tasks).toBeInstanceOf(Array);
    expect(res.body.compliance_items.length).toBeGreaterThan(0);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it('invalid payload: missing case_type should return 400', async () => {
    const payload = {
      jurisdiction: 'NSW',
      opened_at: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', 'Bearer test-admin-token')
      .send(payload);

    expect(res.status).toBe(400); // zod verify failed
    expect(res.body).toHaveProperty('message');
  });

  it('invalid payload: wrong date format should return 400', async () => {
    const payload = {
      case_type: 'Insolvency',
      jurisdiction: 'NSW',
      opened_at: 'not-a-date',
    };

    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', 'Bearer test-admin-token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
