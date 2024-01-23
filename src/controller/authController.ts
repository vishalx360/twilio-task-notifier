import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function authController(fastify: FastifyInstance) {
  // GET /api/auth
  fastify.get("/", async function (
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    reply.send({
      message: "Hello, Auth!",
    });
  });
}
