import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import fp from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    }
}

const plugin = fp(async (fastify: FastifyInstance,) => {
    fastify.register(fastifyJWT, {
        secret: process.env.JWT_SECRET!,
        sign: { expiresIn: '1h' },
    });

    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
}, { name: 'authenticate' });

export default plugin;
