import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const prisma = new PrismaClient();

// clerk
app.use(clerkMiddleware());

// clerk db sync
app.post('/api/sync-user', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;

  await prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId },
  });

  res.sendStatus(200);
});

// route auth
app.use(requireAuth());

// create list
app.post('/api/lists', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;
  const { title } = req.body;

  const user = await prisma.user.findUniqueOrThrow({ where: { clerkId } });
  const list = await prisma.todoList.create({
    data: { title, userId: user.id },
    include: { tasks: true },
  });

  res.json(list);
});

// get lists
app.get('/api/lists', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;

  const user = await prisma.user.findUniqueOrThrow({ where: { clerkId } });
  const lists = await prisma.todoList.findMany({
    where: { userId: user.id },
    include: { tasks: true },
  });

  res.json(lists);
});

// delete list
app.delete('/api/lists/:listId', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;
  const { listId } = req.params;

  // list auth
  const user = await prisma.user.findUniqueOrThrow({ where: { clerkId } });
  // delete tasks in list
  await prisma.task.deleteMany({ where: { listId } });
  // delete list
  await prisma.todoList.delete({ where: { id: listId } });

  res.sendStatus(204);
});

//rename list
app.put('/api/lists/:listId', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;
  const { listId } = req.params;
  const { title } = req.body;

  // list auth
  const list = await prisma.todoList.findFirstOrThrow({
    where: { id: listId },
    include: { user: true },
  });
  if (list.user.clerkId !== clerkId) return res.sendStatus(403);

  const updated = await prisma.todoList.update({
    where: { id: listId },
    data: { title },
    include: { tasks: true },
  });

  res.json(updated);
});


// create task
app.post('/api/lists/:listId/tasks', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;
  const { listId } = req.params;
  const { content } = req.body;

  // list auth
  const user = await prisma.user.findUniqueOrThrow({ where: { clerkId } });
  await prisma.todoList.findFirstOrThrow({ where: { id: listId, userId: user.id } });

  // create action
  const task = await prisma.task.create({
    data: { content, listId },
  });

  res.json(task);
});

// update task
app.put('/api/tasks/:taskId', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;
  const { taskId } = req.params;
  const { completed, content } = req.body;

  // task auth
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { list: { select: { user: true } } },
  });
  if (task.list.user.clerkId !== clerkId) return res.sendStatus(403);

  // update action
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { 
      ...(completed !== undefined && { completed }),
      ...(content !== undefined && { content }),
    },
  });

  res.json(updated);
});

// delete task
app.delete('/api/tasks/:taskId', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.userId) return res.sendStatus(401);
  const clerkId = auth.userId;
  const { taskId } = req.params;

  // task auth
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { list: { select: { user: true } } },
  });
  if (task.list.user.clerkId !== clerkId) return res.sendStatus(403);

  await prisma.task.delete({ where: { id: taskId } });
  res.sendStatus(204);
});

// start
const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});