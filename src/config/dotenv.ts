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
};