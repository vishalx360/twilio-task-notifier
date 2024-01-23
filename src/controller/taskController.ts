import { FastifyInstance } from "fastify";

export default async function taskController(fastify: FastifyInstance) {
  // GET /api/task
  fastify.get("/", async function (_request, reply) {
    reply.send({
      message: "Hello, Task!",
    });
  });
}
