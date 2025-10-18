// server/src/routes/auth.route.ts
// Import Router from Express to define routes
import { Router } from 'express';
// Import the login service function
import { login } from '../services/auth.service';
// Import a custom middleware for request validation
import { validate } from '../middleware/validator';
// Import zod for schema validation
import { z } from 'zod';
// Create a new Express router instance
const router = Router();
// Define a POST route for "/login"
router.post(
  '/login',
  // First middleware: validate request body against a schema
  validate(
    z.object({
      email: z.string().email(),   // email must be valid format
      password: z.string().min(6), // password must have at least 6 characters
    })
  ),
  // Second middleware: handle the actual login logic
  async (req, res, next) => {
    try {
      // Extract the client's IP address (may come from different sources)
      const ip = req.ip || req.connection.remoteAddress;
      // Extract the User-Agent (browser/device info) from request headers
      const userAgent = req.get('User-Agent');
      // Call the login service with request body, IP, and user agent
      const result = await login(req.body, ip, userAgent);
      // Send back the result as JSON response
      res.json(result);
    } catch (error: any) {
      // If an error happens, pass a structured error to the next middleware
      next({
        code: error.code || 'LOGIN_FAILED',               // error code
        message: error.message || 'Login failed',         // error message
        details: error.details || error,                  // error details
      });
    }
  }
);

// Export this router so it can be used in the main app
export default router;
