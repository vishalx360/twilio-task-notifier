import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyPrisma from "@joggr/fastify-prisma";
import { PrismaClient } from "@prisma/client";
import fastify from "fastify";
import { createJsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import router from "./router";


const app = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});


app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'task-notifier',
      description: `Task-Notifier is an innovative task management application designed to keep you seamlessly organized and on top of your responsibilities. With a powerful twist of real-time notifications, this app ensures you never miss a deadline or overlook essential tasks.`,
      version: '1.0.0',
    },
    servers: [{
      url: "http://localhost:3000",
      description: "Local Server"
    }],
  },
  stripBasePath: true,
  transform: createJsonSchemaTransform({
    skipList: ['/documentation/static/*']
  })
});

app.register(fastifySwaggerUI, {
  routePrefix: '/documentation',
});

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Middleware: Router
app.register(fastifyPrisma, {
  client: new PrismaClient(),
  prefix: "prisma",
  clientConfig: {
    log: [{ emit: 'event', level: 'query' }]
  }
});
app.register(router);

export default app;
