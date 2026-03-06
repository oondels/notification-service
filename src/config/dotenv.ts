import { z } from 'zod';
import path from "path";
import dotenv from "dotenv";

const development = process.env.DEV_ENV === 'development'
const envFile = development ? ".env" : ".env.prod";
const envPath = path.resolve(__dirname, "../../", envFile)
dotenv.config({ path: envPath });

const envSchema = z.object({
  EMAIL_HOST: z.string().nonempty(),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().nonempty(),
  RABBITMQ_URL: z.string().url(),
  NOTIFICATION_API_KEY: z.string().nonempty(),
  PORT: z.coerce.number().int().min(1).max(65535).default(6752),
  QUEUE_NAME: z.string().trim().min(1).default('notifications'),
  RABBITMQ_RECONNECT_ATTEMPTS: z.coerce.number().int().min(1).default(10),
  QUEUE_MAX_RETRY_ATTEMPTS: z.coerce.number().int().min(0).default(3),
  QUEUE_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(100).default(5000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Erro na configuração das variaveis de ambiente:', parsed.error.format());
  process.exit(1);
}

export const config = {
  emailHost: parsed.data.EMAIL_HOST,
  emailUser: parsed.data.EMAIL_USER,
  emailPass: parsed.data.EMAIL_PASS,
  rabbitmqUrl: parsed.data.RABBITMQ_URL,
  apiKey: parsed.data.NOTIFICATION_API_KEY,
  port: parsed.data.PORT,
  queueName: parsed.data.QUEUE_NAME,
  rabbitmqReconnectAttempts: parsed.data.RABBITMQ_RECONNECT_ATTEMPTS,
  queueMaxRetryAttempts: parsed.data.QUEUE_MAX_RETRY_ATTEMPTS,
  queueRetryBaseDelayMs: parsed.data.QUEUE_RETRY_BASE_DELAY_MS,
};
