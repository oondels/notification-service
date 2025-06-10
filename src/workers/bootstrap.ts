import { consume } from "../infrastructure/queue/queue"
import { handleNotification } from "../services/notification";
import { MailOptions } from "../types/model";
import logger from "../utils/logger";

/**
 * Inicia o worker para consumir mensagens da fila de notificações
 * e processá-las usando o serviço de notificação
 */
export function startWorker() {
  consume<MailOptions>('notifications', async (payload) => {
    await handleNotification(payload, false);
  });
  
  logger.info("Worker", "Worker de notificação iniciado com sucesso");
}