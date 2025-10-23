import { Router } from 'express';
import { login, getUserInfo ,register} from '../services/auth.service';
import { validate } from '../middleware/validator';
import { z } from 'zod';
import { auth } from '../middleware/auth'; // 

const router = Router();

router.post(
  '/login',
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
  ),
  async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      const result = await login(req.body, ip, userAgent);
      res.json(result);
    } catch (error: any) {
      next({
        code: error.code || 'LOGIN_FAILED',
        message: error.message || 'Login failed',
        details: error.details || error,
      });
    }
  }
);


router.post(
  '/register',
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
      username: z.string().min(1),
      gender: z.number().int().optional(),
      mobile: z.string().optional(),
    })
  ),
  async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      const result = await register(req.body, ip, userAgent);
      res.json(result);
    } catch (error: any) {
      next({
        code: error.code || 'REGISTRATION_FAILED',
        message: error.message || 'Registration failed',
        details: error.details || error,
      });
    }
  }
);


//
router.get('/user_info', auth(['user', 'admin','viewer']), async (req, res, next) => {
  try {
    const userId = req?.user?.id; // 
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userInfo = await getUserInfo(userId);
    res.json(userInfo);
  } catch (error: any) {
    next({
      code: error.code || 'FETCH_FAILED',
      message: error.message || 'Failed to fetch user info',
      details: error.details || error,
    });
  }
});

export default router;