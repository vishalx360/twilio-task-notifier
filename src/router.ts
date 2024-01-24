import { FastifyInstance } from "fastify";
import taskController from "./controller/taskController";
import subtaskController from "./controller/subtaskController";
import authController from "./controller/authController";
import webhookController from "./controller/webhookController";
import indexController from "./controller/indexController";

export default async function router(fastify: FastifyInstance) {
  fastify.register(indexController);
  fastify.register(authController, { prefix: "/api/auth" });
  fastify.register(taskController, { prefix: "/api/task" });
  fastify.register(subtaskController, { prefix: "/api/subtask" });
  fastify.register(webhookController, { prefix: "/api/webhook" });
}
