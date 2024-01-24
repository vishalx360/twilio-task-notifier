import { FastifyInstance } from "fastify";

export default async function taskController(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate)
  // GET /api/task


  fastify.get("/", async function (request, reply) {
    reply.send({
      message: "Hello, Task!",
    });
  });
}
