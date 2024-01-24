import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { GetNewPriority } from "../util";
import { Task, User } from "@prisma/client";
import twilioClient from "../twilioClient";

// Define Zod schema for WEBHOOK
const WEBHOOK_SCHEMA = z.object({
    WEBHOOK_API_KEY: z.string(),
});

export default async function webhookController(fastify: FastifyInstance) {
    // GET /webhook/update-task-priority
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/update-task-priority',
        schema: {
            tags: ['webhook'],
            body: WEBHOOK_SCHEMA,
            description: "Update task's priority based on due-date. Triggered by a cron job.",
        },
        onRequest: async (request, reply) => {
            const { WEBHOOK_API_KEY } = request.body;
            if (WEBHOOK_API_KEY !== process.env.WEBHOOK_API_KEY) {
                reply.status(401).send({ error: 'Unauthorized', message: 'Invalid WEBHOOK_API_KEY provided' });
            }
        },
        handler: async (_request, reply) => {
            try {
                const tasks = await fastify.prisma.task.findMany({
                    where: {
                        status: { not: "DONE" },
                        deleted_at: null
                    },
                    select: { id: true, due_date: true },
                });
                await fastify.prisma.$transaction((prismaTX) => {
                    const UpdateTaskStatusPromises = tasks.map(async (task) => {
                        return prismaTX.task.update({
                            where: { id: task.id },
                            data: { priority: GetNewPriority(task.due_date) },
                        });
                    });
                    return Promise.all(UpdateTaskStatusPromises);
                });
            } catch (error) {
                fastify.log.error(error);
                reply.status(500).send({ error: 'Internal Server Error' });
            }
        }
    });

    // GET /webhook/setup-twilio-call
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/setup-twilio-call',
        schema: {
            tags: ['webhook'],
            body: WEBHOOK_SCHEMA,
            description: 'Voice call webhook based on task due date and user priority.',
        },
        onRequest: async (request, reply) => {
            const { WEBHOOK_API_KEY } = request.body;
            if (WEBHOOK_API_KEY !== process.env.WEBHOOK_API_KEY) {
                reply.status(401).send({ error: 'Unauthorized', message: 'Invalid WEBHOOK_API_KEY provided' });
            }
        },
        handler: async (_request, reply) => {
            try {
                // Fetch tasks with due dates and users with priority
                const tasksWithUsers = await fastify.prisma.task.findMany({
                    where: {
                        status: { not: 'DONE' },
                        deleted_at: null,
                        due_date: { lte: new Date() }, // Only fetch tasks with due dates in the past
                    },
                    include: {
                        user: {
                            select: { id: true, priority: true, phone: true },
                        },
                    },
                    orderBy: { due_date: 'asc' },
                });

                // Group tasks by user priority
                const tasksByPriority = tasksWithUsers.reduce((acc, task) => {
                    const priority = task.user?.priority ?? 3; // Default to priority 3 if not available
                    acc[priority] = acc[priority] || [];
                    acc[priority].push(task as TaskWithUser);
                    return acc;
                }, {} as Record<number, TaskWithUser[]>);

                // Process tasks by priority
                for (let priority = 0; priority <= 2; priority++) {
                    const tasksToCall = tasksByPriority[priority];
                    if (tasksToCall && tasksToCall.length > 0) {
                        const phoneNumbers = tasksToCall.map((task) => task.user?.phone);
                        await MakePhoneCalls(phoneNumbers);
                        break; // Stop processing priorities after the first non-empty priority
                    }
                }
                reply.send({ success: true });
            } catch (error) {
                fastify.log.error(error);
                reply.status(500).send({ error: 'Internal Server Error' });
            }
        },
    });

}
export type TaskWithUser = Task & { user: User | null };


// Utilitu Function to make calls phonenumber using Twilio
export async function MakePhoneCalls(phoneNumbers: (string | undefined)[]): Promise<void> {
    for (const phoneNumber of phoneNumbers) {
        if (phoneNumber) {
            twilioClient.calls
                .create({
                    url: 'http://demo.twilio.com/docs/voice.xml',
                    to: phoneNumber,
                    from: process.env.TWILIO_PHONE_NUMBER!,
                })
                .then(call => console.log(call.sid))
                .catch(err => console.log(err));
        }
    }
}