import express from 'express';
import { createServer } from 'http';

const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});