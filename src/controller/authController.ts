import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

const SIGNIN_SCHEMA = z.object({
  phone: z.string().max(32).describe('Phone Number of the user'),
  password: z.string().max(32).describe('Password of the user account'),
});

const SIGNUP_SCHEMA = SIGNIN_SCHEMA.extend({
  name: z.string().max(32).describe('Name of the user'),
  phone: z.string().max(32).describe('Phone Number of the user'),
  password: z.string().max(32).describe('Password of the user account'),
  confirmPassword: z.string().max(32).describe('Password of the user account'),
})

export default async function authController(fastify: FastifyInstance) {
  // GET /api/auth
  fastify.get("/", async function (_request, reply) {
    // TODO: return current user
    reply.send({
      message: "Hello, Auth!",
    });
  });
  // POST /api/auth/signin
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/signin',
    schema: { body: SIGNIN_SCHEMA },
    handler: (_request, reply) => {
      // TODO: check for correct credentials
      reply.send('ok');
    },
  });
  // POST /api/auth/signup
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/signup',
    schema: { body: SIGNUP_SCHEMA },
    handler: (_request, reply) => {
      // TODO: check if user already exist with phonenumber, if not create one
      reply.send('ok');
    },
  });
}
