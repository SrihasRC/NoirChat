import express from 'express';
import { createServer } from 'http';
import { PORT } from './config/env.ts';
import connectToDatabase from './db/mongodb.ts';

const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  res.send('Welcome to NoirChat API');
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectToDatabase;
});