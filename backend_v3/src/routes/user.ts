import { Router } from 'express';
import { listUsers,updateUserProfile,updatePassword,createUser,deleteUser } from '@/services/user.service';
import { pagination } from '@/middleware/pagination';
import { auth } from '@/middleware/auth';

const router = Router();

// GET /user -
router.get(
  '/',
  auth(['admin']),
  pagination,
  async (req, res) => {
    try {
      const { pagination } = req as any;

      const filters = {
        name: (req.query.name as string) || undefined,
        email: (req.query.email as string) || undefined,
        role: (req.query.role as 'admin' | 'staff' | 'viewer') || undefined,
      };
      
      const result = await listUsers(pagination, filters);
      res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        code: 'LIST_USERS_FAILED',
        message: 'Failed to fetch users',
        details: error,
      });
    }
  }
);

//POST /user
router.post(
  '/',
  auth(['admin']), // Restrict to admin only
  async (req, res) => {
    try {
      const { name, username, email, password, role, mobile, gender } = req.body;

      const result = await createUser({
        name,
        username,
        email,
        password,
        role,
        mobile,
        gender,

      });

      return res.status(result.code === 2000 ? 201 : 400).json(result);
    } catch (error: any) {
      return res.status(500).json({
        code: 5000,
        message: 'Failed to create user',
        details: error.message,
      });
    }
  }
);

//PUT /user/profile
router.put(
  '/profile',
  auth(['admin', 'staff', 'viewer']), // 
  async (req, res) => {
    try {
      const userId = (req as any).user.id; // 
      
      const { name, mobile, email, gender } = req.body;
      
      const result = await updateUserProfile(userId, {
        name,
        mobile,
        email,
        gender,
      });
      
      return res.status(result.code === 2000 ? 200 : 400).json(result);
    } catch (error: any) {
      return res.status(500).json({
        code: 5000,
        message: 'Failed to update profile',
        details: error.message,
      });
    }
  }
);

// PUT /user/password 
router.put(
  '/password',
  auth(['admin', 'staff', 'viewer']), // 
  async (req, res) => {
    try {
      const userId = (req as any).user.id; // 
      
      const { oldPassword, newPassword } = req.body;
      
      //
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          code: 4000,
          message: 'Old password and new password are required',
        });
      }
      
      const result = await updatePassword(userId, {
        oldPassword,
        newPassword,
      });
      
      return res.status(result.code === 2000 ? 200 : 400).json(result);
    } catch (error: any) {
      return res.status(500).json({
        code: 5000,
        message: 'Failed to update password',
        details: error.message,
      });
    }
  }
);
// DELETE /user/:id
router.delete(
  '/:id',
  auth(['admin']), // Restrict to admin only
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10); // Get the user ID from the URL parameter
      
      if (isNaN(userId)) {
        return res.status(400).json({
          code: 4000,
          message: 'Invalid user ID',
        });
      }

      const result = await deleteUser(userId);

      return res.status(result.code === 2000 ? 200 : 400).json(result);
    } catch (error: any) {
      return res.status(500).json({
        code: 5000,
        message: 'Failed to delete user',
        details: error.message,
      });
    }
  }
);

export default router;