import express from 'express';
import { createServer } from 'http';
import { PORT } from './config/env.ts';

const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});