import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import instructorRoutes from './routes/instructor';
import studentRoutes from './routes/student';
const app = express();
const PORT = process.env.API_PORT || 3001;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/', authRoutes);
app.use('/instructor', instructorRoutes);
app.use('/student', studentRoutes);
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});
app.listen(PORT, () => {
  console.log(`API Server running at http://localhost:${PORT}`);
});
export default app;
