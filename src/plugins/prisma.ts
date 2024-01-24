import fastifyPrisma from "@joggr/fastify-prisma";
import { PrismaClient } from "@prisma/client";

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';


const plugin = fp(async (fastify: FastifyInstance,) => {
    fastify.register(fastifyPrisma, {
        client: new PrismaClient(),
        prefix: "prisma",
        clientConfig: {
            log: [{ emit: 'event', level: 'query' }]
        }
    });
}, { name: 'swagger' });

export default plugin;
