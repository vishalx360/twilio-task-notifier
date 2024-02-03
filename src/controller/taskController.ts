import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { userType } from "./authController";
import { GetNewPriority } from "../util";

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
  priority: z.string().optional(),
  due_date: z.string().optional(),
  include_deleted: z.enum(["YES", "NO"]).optional().default("NO"),
  page: z.string().optional(),
  pageSize: z.string().optional(),
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
            due_date: new Date(due_date),
            userId,
            priority: GetNewPriority(new Date(due_date)),
            status: 'TODO',
          },
        });

        reply.send(task);
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // GET /api/task
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['task'],
      querystring: GET_TASKS_SCHEMA,
      description: 'Get all tasks',
    },
    handler: async (request, reply) => {
      const { priority, due_date, include_deleted, page, pageSize, } = request.query;
      const user = request.user as userType;
      const userId = user.id;
      const DEFAULT_PAGE_SIZE = 10;
      try {
        // Calculate offset based on page and pageSize
        const offset = page ? (parseInt(String(page)) - 1) * (pageSize ? parseInt(String(pageSize)) : 10) : 0;
        const filter = {
          userId,
          priority: priority ? parseInt(String(priority)) : undefined,
          due_date: due_date ? { gte: new Date(due_date as string) } : undefined,
          deleted_at: include_deleted === 'YES' ? undefined : { equals: null },
        }

        const tasks = await fastify.prisma.task.findMany({
          where: filter,
          skip: offset,
          take: pageSize ? parseInt(String(pageSize)) : DEFAULT_PAGE_SIZE,
        });
        const totalTasks = await fastify.prisma.task.count({
          where: filter,
        });

        const totalPages = Math.ceil(totalTasks / (pageSize ? parseInt(String(pageSize)) : 10));

        reply.send({
          tasks,
          totalTasks,
          page: page ? parseInt(String(page)) : 1,
          pageSize: pageSize ? parseInt(String(pageSize)) : DEFAULT_PAGE_SIZE,
          totalPages,
        });
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  });

  // PUT /api/task/:task_id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/:task_id',
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
          data: {
            due_date: due_date ? new Date(due_date) : undefined,
            status: status ? status : undefined,
            priority: due_date ? GetNewPriority(new Date(due_date)) : undefined,
          },
        });
        reply.send(task);
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // DELETE /api/task/:task_id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/:task_id',
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
        await fastify.prisma.$transaction(async (prismaTX) => {
          // Delete task
          await prismaTX.task.update({
            where: { id: task_id, userId },
            data: {
              deleted_at: new Date(),
            }
          });
          // Delete all subtasks of this task
          await prismaTX.subTask.updateMany({
            where: { task: { id: task_id, userId } },
            data: {
              deleted_at: new Date(),
            }
          });
        });
        reply.send({ message: 'Task deleted successfully' });
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
}