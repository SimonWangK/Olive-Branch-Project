import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 
const UserFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'staff', 'viewer']).optional(),
});

/**
 * get user list
 */
export async function listUsers(
  pagination: { skip: number; take: number }, 
  filters?: z.infer<typeof UserFilterSchema>
) {
  const { skip, take } = pagination;

  //
  const where: any = {};

  where.role = { not: 'admin' };

  if (filters?.name) {
    where.name = { contains: filters.name, mode: 'insensitive' };
  }
  if (filters?.email) {
    where.email = { contains: filters.email, mode: 'insensitive' };
  }
  if (filters?.role) {
    where.role = filters.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      where,
      include: {
        case_history: {
          select: { id: true },
          take: 1
        },
        tasks: {
          select: { id: true },
          // take: 1
        },
        time_entries: {
          select: { id: true },
          take: 1
        },
        events: {
          select: { id: true },
          take: 1
        }
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  // 
  const formattedUsers = users.map((user) => ({
    ...user,
    case_count: user.case_history.length,
    task_count: user.tasks.length,
    time_entry_count: user.time_entries.length,
    event_count: user.events.length,
    created_at: dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss'),
  }));

  return {
    code: 2000,
    details: formattedUsers,
    pagination: {
      total,
      current: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    },
    filters: filters || {},
  };
}


const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['admin', 'staff', 'viewer'], { message: 'Invalid role' }), // Fix: Use 'message' instead of 'errorMap'
  mobile: z.string().optional(),
  gender: z.number().optional(),
});

/**
 * Create a new user
 */

export async function createUser(data: z.infer<typeof CreateUserSchema>) {
  try {
    // Validate input
    const validatedData = CreateUserSchema.parse(data);

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        code: 4001,
        message: 'Email already exists',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        mobile: validatedData.mobile,
        gender: validatedData.gender,
        avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',  
        created_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        mobile: true,
        gender: true,
        avatar: true,
        created_at: true,
      },
    });

    return {
      code: 2000,
      message: 'User created successfully',
      detail: {
        ...newUser,
        created_at: dayjs(newUser.created_at).format('YYYY-MM-DD HH:mm:ss'),
      },
    };
  } catch (error: any) {
    console.error('Create user error:', error);
    return {
      code: 5000,
      message: 'Failed to create user',
      details: error.message,
    };
  }
}

/**
 * update user profile
 */
export async function updateUserProfile(
  userId: number,
  data: {
    name?: string;
    mobile?: string;
    email?: string;
    gender?: number;
  }
) {
  try {

    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.mobile !== undefined) {
      updateData.mobile = data.mobile;
    }
    
    if (data.email !== undefined) {

      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: {
            id: userId
          }
        }
      });
      
      if (existingUser) {
        return {
          code: 4001,
          message: 'Email already exists',
        };
      }
      
      updateData.email = data.email;
    }
    
    if (data.gender !== undefined) {
      updateData.gender = data.gender;
    }
    

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        mobile: true,
        gender: true,
        avatar: true,
        role: true,
      }
    });
    
    return {
      code: 2000,
      message: 'Profile updated successfully',
      detail: updatedUser,
    };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      code: 5000,
      message: 'Failed to update profile',
      details: error.message,
    };
  }
}

/**
 * update password
 */
export async function updatePassword(
  userId: number,
  data: {
    oldPassword: string;
    newPassword: string;
  }
) {
  try {

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      }
    });
    
    if (!user) {
      return {
        code: 4004,
        message: 'User not found',
      };
    }
    

    const isPasswordValid = await bcrypt.compare(data.oldPassword, user.password);
    
    if (!isPasswordValid) {
      return {
        code: 4001,
        message: 'Old password is incorrect',
      };
    }
    
  
    if (data.newPassword.length < 6) {
      return {
        code: 4002,
        message: 'New password must be at least 6 characters long',
      };
    }
    

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    return {
      code: 2000,
      message: 'Password updated successfully',
    };
  } catch (error: any) {
    console.error('Update password error:', error);
    return {
      code: 5000,
      message: 'Failed to update password',
      details: error.message,
    };
  }
}


/**
 * Delete a user
 */
export async function deleteUser(userId: number) {
  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        code: 4004,
        message: 'User not found',
      };
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return {
      code: 2000,
      message: 'User deleted successfully',
    };
  } catch (error: any) {
    console.error('Delete user error:', error);
    return {
      code: 5000,
      message: 'Failed to delete user',
      details: error.message,
    };
  }
}
