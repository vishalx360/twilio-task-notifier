import Fastify from "fastify";
import router from "./router";

import authenticate from "./plugins/authenticate";
import prisma from "./plugins/prisma";
import swagger from "./plugins/swagger";
import validator from "./plugins/validator";

const fastify = Fastify({ logger: true });

// plugins
fastify.register(swagger);
fastify.register(validator);
fastify.register(authenticate);
fastify.register(prisma);

fastify.register(router);

export default fastify;
