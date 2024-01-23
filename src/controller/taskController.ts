import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function taskController(fastify: FastifyInstance) {
  // GET /api/task
  fastify.get("/", async function (
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    reply.send({
      message: "Hello, Task!",
    });
  });
}
