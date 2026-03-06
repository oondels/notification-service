import { consume } from "../infrastructure/queue/queue"
import { handleNotification } from "../services/notification";
import { MailOptions } from "../types/model";
import logger from "../utils/logger";
import { config } from "../config/dotenv";

/**
 * Inicia o worker para consumir mensagens da fila de notificações
 * e processá-las usando o serviço de notificação
 */
export async function startWorker() {
  await consume<MailOptions>(config.queueName, async (payload) => {
    await handleNotification(payload, false);
  });
  
  logger.info("Worker", `Worker de notificação iniciado com sucesso na fila ${config.queueName}`);
}
