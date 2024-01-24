import fastify from "./app";


const port = Number(process.env.PORT) || 3000;
const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;


fastify.listen({ host, port });

console.log(`🚀  Fastify server running on port http://localhost:${port}`);
console.log(`Route index: /`);
console.log(`Route auth: /api/auth`);
console.log(`Route task: /api/task`);
