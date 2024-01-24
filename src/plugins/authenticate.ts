import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import fp from 'fastify-plugin';
import { env } from '../env';


declare module 'fastify' {
    interface FastifyInstance {
        authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
        authenticateWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    }
}

const plugin = fp(async (fastify: FastifyInstance,) => {
    fastify.register(fastifyJWT, {
        secret: env.JWT_SECRET!,
        sign: { expiresIn: '1h' },
    });

    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    fastify.decorate('authenticateWebhook', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            const WEBHOOK_API_KEY = request.headers?.api_key;
            if (WEBHOOK_API_KEY !== env.WEBHOOK_API_KEY) {
                reply.status(401).send({ error: 'Unauthorized', message: 'Invalid WEBHOOK_API_KEY provided' });
            }
        } catch (err) {
            reply.send(err);
        }
    });


}, { name: 'authenticate-plugin' });

export default plugin;
