import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createJsonSchemaTransform } from "fastify-type-provider-zod";


const plugin = fp(async (fastify: FastifyInstance,) => {
    fastify.register(fastifySwagger, {
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

    fastify.register(fastifySwaggerUI, {
        routePrefix: '/documentation',
    });
}, { name: 'swagger' });

export default plugin;
