import fastify from "./app";
import { env } from "./env";

const PORT = Number(env.PORT) || 3000;

fastify.listen({ port: PORT });

console.log(`🚀  Fastify server running on port http://localhost:${PORT}`);
console.log(`Route index: /`);
console.log(`Route auth: /api/auth`);
console.log(`Route task: /api/task`);
