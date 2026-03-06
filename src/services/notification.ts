import { MailOptions } from '../types/model';
import sendEmail from '../infrastructure/mail/mailer';
import { publish } from '../infrastructure/queue/queue';
import logger from '../utils/logger';
import { config } from '../config/dotenv';

function resolveDelayInMs(payload: MailOptions): number {
  if (payload.scheduleAt !== undefined) {
    const scheduleAtMs = typeof payload.scheduleAt === 'string'
      ? Date.parse(payload.scheduleAt)
      : payload.scheduleAt;

    if (!Number.isFinite(scheduleAtMs)) {
      return 0;
    }

    return Math.max(0, scheduleAtMs - Date.now());
  }

  if (payload.scheduleFor !== undefined) {
    return payload.scheduleFor;
  }

  return 0;
}

/**
 * Processa uma notificação por email
 * 
 * @param {EmailPayload} payload - Dados do email a ser enviado
 * @returns {Promise<void>}
 */
export async function handleNotification(payload: MailOptions, enqueue: boolean = true) {
  // Enfileira apenas se solicitado -> Via api (POST)
  if (enqueue) {
    const delay = resolveDelayInMs(payload);

    if (delay > 0) {
      const scheduledFor = new Date(Date.now() + delay).toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      logger.info("NotificationService", `Agendando notificação para ${payload.to} em ${scheduledFor}`);
    } else {
      logger.info("NotificationService", `Enfileirando notificação imediata para ${payload.to}`);
    }

    await publish(config.queueName, payload, delay);
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
