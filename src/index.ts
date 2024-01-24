import fastify from "./app";

const FASTIFY_PORT = Number(process.env.FASTIFY_PORT) || 3000;

fastify.listen({ port: FASTIFY_PORT });

console.log(`🚀  Fastify server running on port http://localhost:${FASTIFY_PORT}`);
console.log(`Route index: /`);
console.log(`Route auth: /api/auth`);
console.log(`Route task: /api/task`);
