// import { PrismaClient } from '@prisma/client';
// import { hashPassword } from '@/services/auth.service'; 

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Seeding database...');

//   await prisma.user.deleteMany();


//   const adminPassword = await hashPassword('88888888');
//   await prisma.user.create({
//     data: {
//       name: 'ethen',
//       email: 'ethen@example.com',
//       role: 'admin',
//       password: adminPassword,
//       created_at: new Date(),
//     },
//   });

//   console.log('Seeding completed.');
// }

// main()
//   .catch((e) => {
//     console.error('Seeding failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
