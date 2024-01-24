import fastify from "./app";
import { env } from "./env";

const FASTIFY_PORT = Number(env.FASTIFY_PORT) || 3000;

fastify.listen({ port: FASTIFY_PORT });

console.log(`🚀  Fastify server running on port http://localhost:${FASTIFY_PORT}`);
console.log(`Route index: /`);
console.log(`Route auth: /api/auth`);
console.log(`Route task: /api/task`);
