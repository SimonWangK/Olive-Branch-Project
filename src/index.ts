import express from 'express';
// import { setupRoutes } from '@/routes';
// import { errorMiddleware } from '@/middleware/error';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// setupRoutes(app);
// app.use(errorMiddleware);


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


export default app;
