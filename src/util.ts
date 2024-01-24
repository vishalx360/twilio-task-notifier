import { Prisma, type PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { differenceInDays, startOfDay } from 'date-fns';

// Priority for task model
// 0 - Due date is today //0
// 1 - Due date is between tomorrow and day after tomorrow // 1-2
// 2 - 3-4
// 3 - 5+
export function GetNewPriority(due_date: Date) {
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = startOfDay(new Date());
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const daysDifference = differenceInDays(startOfDay(new Date(due_date)), today);

    if (daysDifference <= 0) {
        return 0; // Due date is today
    } else if (daysDifference <= 1) {
        return 1; // Due date is between tomorrow and day after tomorrow
    } else if (daysDifference <= 2) {
        return 2; // Due date is between tomorrow and day after tomorrow
    } else {
        return 3; // Due date is 3 days or more in the future
    }
}


type PrismaTransaction = Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

// Status for task model
// “TODO” - when no sub task is finished
// “IN_PROGRESS” - when at least 1 sub task is finished
// “DONE” - when every sub task is completed
export async function UpdateTaskStatus({ prismaTX, task_id }: { prismaTX: PrismaTransaction, task_id: string }) {
    const totalSubtasks = await prismaTX.subTask.count({
        where: { task_id },
    });
    const completedSubtasks = await prismaTX.subTask.count({
        where: { task_id, status: 1 },
    });
    const taskStatus = completedSubtasks === 0 ? 'TODO' : completedSubtasks === totalSubtasks ? 'DONE' : 'IN_PROGRESS';

    await prismaTX.task.update({
        where: { id: task_id },
        data: { status: taskStatus },
    });
}
