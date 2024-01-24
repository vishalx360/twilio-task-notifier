import "dotenv/config";
const { createEnv } = require("@t3-oss/env-core");
import { z } from "zod";

export const env = createEnv({
    server: {
        PORT: z.string().min(1).optional(),
        HOST_URL: z.string().url(),
        DATABASE_URL: z.string().url(),
        DIRECT_URL: z.string().url(),
        JWT_SECRET: z.string(),
        TWILIO_ACCOUNT_SID: z.string().min(1),
        TWILIO_AUTH_TOKEN: z.string().min(1),
        TWILIO_PHONE_NUMBER: z.string().min(1),
        WEBHOOK_API_KEY: z.string().min(1),
    },
    runtimeEnv: process.env,
});