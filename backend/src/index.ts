import express from 'express';
import { createServer } from 'http';
import { PORT } from './config/env.ts';
import cors from 'cors';
import connectToDatabase from './db/mongodb.ts';
import authRouter from './routes/auth.route.ts';
import friendRouter from './routes/friend.route.ts';
import cookieParser from 'cookie-parser';
import messageRouter from './routes/message.route.ts';
import roomRouter from './routes/room.route.ts';

const app = express();
const server = createServer(app);

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/friends', friendRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/rooms', roomRouter);

app.get('/', (req, res) => {
  res.send('Welcome to NoirChat API');
});

server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDatabase();
});