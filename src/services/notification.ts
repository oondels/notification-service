import { MailOptions } from '../types/model';
import sendEmail from '../infrastructure/mail/mailer';
import { publish } from '../infrastructure/queue/queue';
import logger from '../utils/logger';

/**
 * Processa uma notificação por email
 * 
 * @param {EmailPayload} payload - Dados do email a ser enviado
 * @returns {Promise<void>}
 */
export async function handleNotification(payload: MailOptions, enqueue: boolean = true) {
  // Enfileira apenas se solicitado -> Via api (POST)
  if (enqueue) {
    let delay = 0;

    if (payload.scheduleFor) {
      const now = Date.now()
      delay = payload.scheduleFor

      // Formato para arquivar em log
      const scheduledFor = new Date(delay + now).toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      logger.info("NotificationService", `Agendando notificação para: ${payload.to} -> ${scheduledFor.toString()}`);

      console.log(`Delay : ${delay}`);

    }

    await publish('notifications', payload, delay);
    return;
  }

  // Envia o email (apenas quando processado pelo worker ou chamado diretamente)
  await sendEmail({
    to: payload.to,
    subject: payload.subject,
    title: payload.title,
    message: payload.message,
    link: payload.link ?? undefined,
    application: payload.application ?? undefined
  });
}
