import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { userType } from "./authController";
import { UpdateTaskStatus } from "../util";


// Define Zod schema for SUBTASK
const CREATE_SUBTASK_SCHEMA = z.object({
  task_id: z.string(),
});
const GET_SUBTASKS_SCHEMA = z.object({
  task_id: z.string().optional(),
  include_deleted: z.enum(["YES", "NO"]).optional().default("NO")
});
const GET_SUBTASK_SCHEMA = z.object({
  subtask_id: z.string(),
});
const UPDATE_SUBTASK_SCHEMA = z.object({
  status: z.number().min(0).max(1),
});
const DELETE_SUBTASK_SCHEMA = z.object({
  subtask_id: z.string(),
});


export default async function subtaskController(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  // POST /api/subtask/
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['subtask'],
      body: CREATE_SUBTASK_SCHEMA,
      description: 'Create a new subtask',
    },
    handler: async (request, reply) => {
      const { task_id } = request.body;

      const user = request.user as userType;
      const userId = user.id;

      try {
        const task = await fastify.prisma.task.findUnique({
          where: { id: task_id, userId },
          select: { id: true },
        });
        if (!task) {
          reply.status(404).send({ error: 'Task not found' });
          return;
        }
        await fastify.prisma.$transaction(async (prismaTX) => {
          const subtask = await fastify.prisma.subTask.create({
            data: {
              status: 0, // 0 - TODO, 1 - DONE
              task_id: task?.id,
            },
          });
          await UpdateTaskStatus({ prismaTX: prismaTX, task_id: subtask.task_id });
          reply.send(subtask);
        });

      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
  // GET /api/subtask/
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['subtask'],
      querystring: GET_SUBTASKS_SCHEMA,
      description: 'Get all subtasks of a task',
    },
    handler: async (request, reply) => {
      const { task_id, include_deleted } = request.query;


      const user = request.user as userType
      const userId = user.id;

      try {
        const subtasks = await fastify.prisma.subTask.findMany({
          where: {
            task_id: task_id ? task_id as string : undefined,
            task: { userId },
            deleted_at: include_deleted === 'YES' ? undefined : { equals: null },
          },
        });

        reply.send(subtasks);
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // PUT /api/subtask/:subtask_id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/:subtask_id',
    schema: {
      tags: ['subtask'],
      params: GET_SUBTASK_SCHEMA,
      body: UPDATE_SUBTASK_SCHEMA,
      description: 'Update subtask status',
    },
    handler: async (request, reply) => {
      const { subtask_id } = request.params;
      const { status } = request.body;


      const user = request.user as userType
      const userId = user.id;

      try {
        await fastify.prisma.$transaction(async (prismaTX) => {
          const subtask = await prismaTX.subTask.update({
            where: { id: subtask_id, task: { userId } },
            data: { status },
          });
          await UpdateTaskStatus({ prismaTX: prismaTX, task_id: subtask.task_id });
          reply.send(subtask);
        });
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
  // DELETE /api/subtask/:subtask_id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/:subtask_id',
    schema: {
      tags: ['subtask'],
      params: DELETE_SUBTASK_SCHEMA,
      description: 'Delete a subtask',
    },
    handler: async (request, reply) => {
      const { subtask_id } = request.params;

      const user = request.user as userType
      const userId = user.id;

      try {
        await fastify.prisma.subTask.update({
          where: { id: subtask_id, task: { userId } },
          data: { deleted_at: new Date() },
        });

        reply.send({ message: 'Subtask deleted successfully' });
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  })
}
