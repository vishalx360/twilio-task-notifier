import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { hash, verify } from 'argon2';

const LOGIN_SCHEMA = z.object({
  phone: z.string().max(32).describe('Phone Number of the user'),
  password: z.string().max(32).describe('Password of the user account'),
});

const REGISTER_SCHEMA = LOGIN_SCHEMA.extend({
  phone: z.string().max(32).describe('Phone Number of the user'),
  password: z.string().max(32).describe('Password of the user account'),
  confirmPassword: z.string().max(32).describe('Password of the user account'),
})

export type userType = {
  id: string;
  phone: string;
};

export default async function authController(fastify: FastifyInstance) {

  // POST /api/auth/register
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/register',
    schema: {
      body: REGISTER_SCHEMA,
      security: [],
      tags: ['auth'],
      description: 'Register a new user',
    },
    handler: async (request, reply) => {
      const { password, phone, confirmPassword } = request.body

      if (password !== confirmPassword) {
        return reply.code(400).send({
          message: 'Password and confirm-password should be same',
        })
      }

      const user = await fastify.prisma.user.findUnique({ where: { phone } })

      if (user) {
        return reply.code(400).send({
          message: 'User already exists with this phone',
        })
      }
      try {
        const hash_value = await hash(password)
        const user = await fastify.prisma.user.create({
          data: {
            phone,
            password: hash_value,
          },
        })
        return reply.code(201).send({
          message: `Registered user successfully with ${user.phone}`
        })
      } catch (e) {
        return reply.code(500).send(e)
      }
    },
  });

  // POST /api/auth/login
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/login',
    schema: {
      body: LOGIN_SCHEMA,
      security: [],
      tags: ['auth'],
      description: 'Login a user',
    },
    handler: async (request, reply) => {
      const { password, phone } = request.body
      const user = await fastify.prisma.user.findUnique({ where: { phone } })
      if (!user) {
        return reply.code(404).send({
          message: 'User does not exist with this phone',
        })
      }
      try {
        const correct = await verify(user.password, password);
        if (!correct) {
          return reply.code(401).send({
            message: 'Incorrect Password',
          })
        }

        const token = await reply.jwtSign({
          id: user.id,
          phone: user.phone,
        })

        return reply.code(201).send({
          message: `Logged in successfully, token generated ${user.phone}`,
          token,
        })
      } catch (e) {
        return reply.code(500).send(e)
      }
    },
  });

  // GET /api/auth
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      security: [],
      tags: ['auth'],
      description: 'Get current user',
    },
    handler: async (request, reply) => {
      reply.send(request.user);
    }
  });
}
