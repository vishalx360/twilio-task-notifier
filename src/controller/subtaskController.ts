import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { userType } from "./authController";


// Define Zod schema for SUBTASK
const CREATE_SUBTASK_SCHEMA = z.object({
  task_id: z.string(),
});
const GET_SUBTASKS_SCHEMA = z.object({
  task_id: z.string(),
});
const GET_SUB_TASK_SCHEMA = z.object({
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
        const subtask = await fastify.prisma.subTask.create({
          data: {
            status: 0, // Change as needed
            task_id: task?.id,
          },
        });
        reply.send(subtask);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
  // GET /api/subtasks
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/subtasks',
    schema: {
      tags: ['subtask'],
      querystring: GET_SUBTASKS_SCHEMA,
      description: 'Get all subtasks of a task',
    },
    handler: async (request, reply) => {
      const { task_id } = request.query;


      const user = request.user as userType
      const userId = user.id;

      try {
        const subtasks = await fastify.prisma.subTask.findMany({
          where: {
            task_id: task_id as string,
            task: { userId },
          },
        });

        reply.send(subtasks);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // PUT /api/subtask/:id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/:id',
    schema: {
      tags: ['subtask'],
      params: GET_SUB_TASK_SCHEMA,
      body: UPDATE_SUBTASK_SCHEMA,
      description: 'Update subtask status',
    },
    handler: async (request, reply) => {
      const { subtask_id } = request.params;
      const { status } = request.body;


      const user = request.user as userType
      const userId = user.id;

      try {
        const subtask = await fastify.prisma.subTask.update({
          where: { id: subtask_id, task: { userId } },
          data: { status },
        });

        reply.send(subtask);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
  // DELETE /api/subtask/:id
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/:id',
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
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  })
}
