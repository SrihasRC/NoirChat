import express from 'express';
import { createServer } from 'http';
import { PORT } from './config/env.ts';
import connectToDatabase from './db/mongodb.ts';
import authRouter from './routes/auth.route.ts';
import cookieParser from 'cookie-parser';

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);

app.get('/', (req, res) => {
  res.send('Welcome to NoirChat API');
});

server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDatabase();
});