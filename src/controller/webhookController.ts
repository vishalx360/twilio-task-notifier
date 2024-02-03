import { Task, User } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { env } from "../env";
import twilioClient from "../twilioClient";
import { GetNewPriority } from "../util";
import { sub } from "date-fns";

export default async function webhookController(fastify: FastifyInstance) {
    // GET /api/webhook/update-task-priority
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/update-task-priority',
        schema: {
            tags: ['cron-job webhook'],
            security: [{ apikeyAuth: [] }],
            description: "Update task's priority based on due-date. Triggered by a cron job.",
        },
        onRequest: fastify.authenticateWebhook,
        handler: async (_request, reply) => {
            try {
                const tasks = await fastify.prisma.task.findMany({
                    where: {
                        status: { not: "DONE" },
                        deleted_at: null
                    },
                    select: { id: true, due_date: true },
                });
                const result = await fastify.prisma.$transaction((prismaTX) => {
                    const UpdateTaskStatusPromises = tasks.map(async (task) => {
                        return prismaTX.task.update({
                            where: { id: task.id },
                            data: { priority: GetNewPriority(task.due_date) },
                        });
                    });
                    return Promise.all(UpdateTaskStatusPromises);
                });
                reply.send(result);
            } catch (error) {
                fastify.log.error(error);
                reply.status(500).send({ error: 'Internal Server Error' });
            }
        }
    });

    // GET /api/webhook/setup-twilio-call
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/setup-twilio-call',
        schema: {
            tags: ['cron-job webhook'],
            security: [{ apikeyAuth: [] }],
            description: 'Voice call webhook based on task due date and user priority.',
        },
        onRequest: fastify.authenticateWebhook,
        handler: async (_request, reply) => {
            try {
                // Fetch tasks with due dates and users with priority
                const currentTime = new Date();
                const tasksWithUsers = await fastify.prisma.task.findMany({
                    where: {
                        status: { not: 'DONE' },
                        deleted_at: null,
                        due_date: {
                            lte: currentTime,
                            gte: sub(currentTime, { minutes: 30 })
                        }, // Only fetch tasks with due dates in the past 30mins
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
                const allCallSids: string[] = [];
                for (let priority = 0; priority <= 2; priority++) {
                    const tasksToCall = tasksByPriority[priority];
                    if (tasksToCall && tasksToCall.length > 0) {
                        const phoneNumbers = tasksToCall.map((task) => task.user?.phone);
                        allCallSids.push(...await MakePhoneCalls(phoneNumbers));
                        break; // Stop processing priorities after the first non-empty priority
                    }
                }
                reply.send(allCallSids);
            } catch (error) {
                fastify.log.error(error);
                reply.status(500).send({ error: 'Internal Server Error' });
            }
        },
    });
    // POST /api/webhook/handel-twilio-call
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/handle-twilio-call',
        schema: {
            tags: ['twilio webhook'],
            security: [{ apikeyAuth: [] }],
            description: 'Handle Twilio call webhook.',
        },
        onRequest: fastify.authenticateWebhook,
        handler: async (_request, reply) => {
            try {
                // todo: get user's phone number from request for dynamic voice response
                const vr = new VoiceResponse();
                vr.say({ voice: 'woman' }, 'Hello! This is a friendly reminder from Twilio Task Notifier.');
                vr.pause({ length: 1 });
                vr.say({ voice: 'woman' }, 'You have one or more tasks due soon.');
                vr.pause({ length: 1 });
                vr.say({ voice: 'woman' }, 'Please review your tasks and take necessary actions.');
                vr.pause({ length: 1 });
                vr.say({ voice: 'woman' }, 'Thank you for using Twilio Task Notifier. Have a productive day!');

                reply.send(vr.toString()); // Output the XML response
            } catch (error) {
                fastify.log.error(error);
                reply.status(500).send({ error: 'Internal Server Error' });
            }
        },
    });
}

export type TaskWithUser = Task & { user: User | null };

// Utilitu Function to make calls phonenumber using Twilio
export async function MakePhoneCalls(phoneNumbers: (string | undefined)[]): Promise<string[]> {
    const allCallSids: string[] = []
    for (const phoneNumber of phoneNumbers) {
        if (phoneNumber) {
            twilioClient.calls
                .create({
                    to: phoneNumber,
                    from: env.TWILIO_PHONE_NUMBER!,
                    url: `${env.HOST_URL}/api/webhook/handel-twilio-call`,
                })
                .then(call => {
                    allCallSids.push(call.sid);
                })
                .catch(err => console.log(err));
        }
    }
    return allCallSids;
}