import Fastify from "fastify";
import { env } from "./env";

import app from "./app";
const PORT = Number(env.PORT) || 3000;


const fastify = Fastify({ logger: true });


fastify.register(app);


fastify.listen({ port: PORT });

console.log(`🚀  Fastify server running on port http://localhost:${PORT}`);
console.log(`Route index: /`);
console.log(`Route auth: /api/auth`);
console.log(`Route task: /api/task`);
