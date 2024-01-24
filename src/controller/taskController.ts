import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { userType } from "./authController";

// Define Zod schema for TASK 
const CREATE_TASK_SCHEMA = z.object({
  title: z.string(),
  description: z.string(),
  due_date: z.string(),
});
const GET_TASK_SCHEMA = z.object({
  task_id: z.string(),
});
const GET_TASKS_SCHEMA = z.object({
  priority: z.number().min(1).max(3).optional(),
  due_date: z.string().optional(),
});
const UPDATE_TASK_SCHEMA = z.object({
  due_date: z.string().optional(),
  status: z.enum(['TODO', 'DONE']).optional(),
});
const DELETE_TASK_SCHEMA = z.object({
  task_id: z.string(),
});

export default async function taskController(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  // POST /api/task  
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['task'],
      body: CREATE_TASK_SCHEMA,
      description: 'Create a new task',
    },
    handler: async (request, reply) => {

      const { title, description, due_date } = request.body;
      const user = request.user as userType;
      const userId = user.id;

      try {
        const task = await fastify.prisma.task.create({
          data: {
            title,
            description,
            due_date,
            userId,
            priority: 2, // Change as needed
            status: 'TODO', // Change as needed
          },
        });

        reply.send(task);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // GET /api/tasks
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/tasks',
    schema: {
      tags: ['task'],
      querystring: GET_TASKS_SCHEMA,
      description: 'Get all tasks',
    },
    handler: async (request, reply) => {
      const { priority, due_date } = request.query;
      const user = request.user as userType;
      const userId = user.id;

      try {
        const tasks = await fastify.prisma.task.findMany({
          where: {
            userId,
            priority: priority ? parseInt(String(priority)) : undefined,
            due_date: due_date ? { gte: new Date(due_date as string) } : undefined,
          },
        });

        reply.send(tasks);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // PUT /api/task/:id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/task/:id',
    schema: {
      tags: ['task'],
      params: GET_TASK_SCHEMA,
      body: UPDATE_TASK_SCHEMA,
      description: 'Update a task',
    },
    handler: async (request, reply) => {
      const { task_id } = request.params;
      const { due_date, status } = request.body;


      const user = request.user as userType;
      const userId = user.id;

      try {
        const task = await fastify.prisma.task.update({
          where: { id: task_id, userId },
          data: { due_date, status },
        });

        reply.send(task);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // DELETE /api/task/:id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      tags: ['task'],
      params: DELETE_TASK_SCHEMA,
      description: 'Delete a task',
    },
    handler: async (request, reply) => {
      const { task_id } = request.params;

      const user = request.user as userType;
      const userId = user.id;

      try {
        await fastify.prisma.task.update({
          where: { id: task_id, userId },
          data: { deleted_at: new Date() },
        });

        reply.send({ message: 'Task deleted successfully' });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
}
