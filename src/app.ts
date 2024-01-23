import fastify from "fastify";
import router from "./router";
import { PrismaClient } from "@prisma/client";
import fastifyPrisma from "@joggr/fastify-prisma";

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});

// Middleware: Router
server.register(fastifyPrisma, {
  client: new PrismaClient(),
  prefix: "prisma",
  clientConfig: {
    log: [{ emit: 'event', level: 'query' }]
  }
});
server.register(router);

export default server;
