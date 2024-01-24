import router from "./router";

import authenticate from "./plugins/authenticate";
import prisma from "./plugins/prisma";
import swagger from "./plugins/swagger";
import validator from "./plugins/validator";

import { FastifyInstance, FastifyServerOptions } from 'fastify';

export default async function (fastify: FastifyInstance, _opts: FastifyServerOptions, done: () => void) {
    // plugins
    fastify.register(swagger);
    fastify.register(validator);
    fastify.register(authenticate);
    fastify.register(prisma);

    fastify.register(router);

    done()
}
