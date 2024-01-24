import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createJsonSchemaTransform } from "fastify-type-provider-zod";


const plugin = fp(async (fastify: FastifyInstance,) => {
    fastify.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Twilio Task Notifier',
                description: `Twilio Task Notifier is an innovative task management application designed to keep you seamlessly organized and on top of your responsibilities. With a powerful twist of real-time notifications, this app ensures you never miss a deadline or overlook essential tasks.`,
                version: '1.0.0',
            },
            servers: [{
                url: "https://twilio-task-notifier.onrender.com",
                description: "Remote Server"
            }, {
                url: "http://localhost:3000",
                description: "Local Server"
            }],
            tags: [
                { name: 'auth', description: 'Authentication related end-points' },
                { name: 'task', description: 'Task related end-points' },
                { name: 'subtask', description: 'Subtask related end-points' },
                { name: 'cron-job webhook', description: 'Webhook related end-points for cronjob' },
                { name: 'twilio webhook', description: 'Webhook related end-points for twilio' },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'JWT Token',
                    },
                    apikeyAuth: {
                        type: 'apiKey',
                        name: 'WEBHOOK_API_KEY',
                        in: 'header',
                        description: 'Webhook API Key',
                    },
                },
            },

            security: [{
                bearerAuth: [],
            }],
        },
        hideUntagged: true,
        stripBasePath: true,
        transform: createJsonSchemaTransform({
            skipList: ['/documentation/static/*']
        }),
    });

    fastify.register(fastifySwaggerUI, {
        routePrefix: '/documentation',
    });
}, { name: 'swagger' });

export default plugin;
