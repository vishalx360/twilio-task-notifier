import twilio from 'twilio';
import { env } from './env';

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;

const twilioClient = twilio(accountSid, authToken, {
    lazyLoading: true,
    autoRetry: true,
    maxRetries: 3,
});

export default twilioClient;

