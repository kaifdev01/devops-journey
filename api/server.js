require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const Task = mongoose.model(
  'Task',
  new mongoose.Schema(
    { title: { type: String, required: true }, done: { type: Boolean, default: false } },
    { timestamps: true }
  )
);

app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    db: connected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

app.get('/tasks', async (req, res) => {
  res.json(await Task.find().limit(50));
});

app.post('/tasks', async (req, res) => {
  const task = await Task.create({ title: req.body.title });
  res.status(201).json(task);
});

app.get('/slow', async (req, res) => {
  await new Promise((r) => setTimeout(r, 5000));
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));


const server = app.listen(PORT, () => console.log(`API listening on ${PORT}`));

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received: shutting down gracefully`);

  server.close(async () => {
    await mongoose.connection.close();
    console.log('Server and DB connection closed');
    process.exit(0);
  });

  // Agar 10 second mein band na ho to zabardasti
  setTimeout(() => {
    console.error('Forced exit after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
