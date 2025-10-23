import express from 'express';
import cors from 'cors';  // Import the cors package
import { setupRoutes } from '@/routes';
import { errorMiddleware } from '@/middleware/error';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: '*',  // Allow requests from this origin (frontend)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
  credentials: true,  // Allow credentials like cookies or Authorization headers
};

// Use the CORS middleware
app.use(cors(corsOptions));

// Middleware for parsing JSON requests
app.use(express.json());

// Setup routes
setupRoutes(app);

// Error handling middleware
app.use(errorMiddleware);

// Start the server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
