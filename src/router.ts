import { FastifyInstance } from "fastify";
import taskController from "./controller/taskController";
import subtaskController from "./controller/subtaskController";
import authController from "./controller/authController";
import indexController from "./controller/indexController";

export default async function router(fastify: FastifyInstance) {
  fastify.register(indexController, { prefix: "/" });
  fastify.register(authController, { prefix: "/api/auth" });
  fastify.register(taskController, { prefix: "/api/task" });
  fastify.register(subtaskController, { prefix: "/api/subtask" });
}
