import { connectQueue } from "./connection"
import { ConsumeMessage } from 'amqplib';
import logger from "../../utils/logger";

/**
 * Publica uma mensagem na fila do RabbitMQ
 * com ou sem delay
 * 
 * @template T - Tipo do payload a ser publicado
 * @param {string} queueName - Nome da fila onde a mensagem será publicada
 * @param {T} payload - Dados a serem enviados para a fila
 * @param {dealy} delay programado
 * @returns {Promise<void>}
 */
export async function publish<T>(queueName: string, payload: T, delay: number = 0) {
  const conn = await connectQueue();
  const channel = await conn.createChannel();

  await channel.assertQueue(queueName, { durable: true });

  if (delay > 0) {
    const DELAY_EXCHANGE = "delayed_exchange"
    const DELAY_QUEUE = `delayed_${queueName}`

    await channel.assertExchange(DELAY_EXCHANGE, "direct", { durable: true })
    await channel.assertQueue(DELAY_QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": queueName,
      }
    })

    // Envia para a fila com delay
    channel.sendToQueue(DELAY_QUEUE, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      expiration: delay
    })
  } else {
    // Envia para a fila normal
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), { persistent: true })
  }

  await channel.close();
}

/**
 * Consome mensagens de uma fila específica do RabbitMQ
 * 
 * @template T - Tipo do payload a ser consumido
 * @param {string} queueName - Nome da fila de onde as mensagens serão consumidas
 * @param {function} handler - Função que processa cada mensagem recebida
 * @returns {Promise<void>}
 */
export async function consume<T>(queueName: string, handler: (msg: T) => Promise<void>) {
  const conn = await connectQueue()
  const channel = await conn.createChannel()

  // Garante que a fila existe antes de tentar consumir
  await channel.assertQueue(queueName, { durable: true })

  await channel.prefetch(1);

  // Configura o consumo da fila
  channel.consume(queueName, async (raw: ConsumeMessage | null) => {
    if (!raw) return

    const data = JSON.parse(raw.content.toString()) as T;
    // Para evitar erro de tipagem com propriedades desconhecidas, usamos uma abordagem segura:
    const messageInfo = typeof data === 'object' && data !== null
      ? `Processando notificação para ${(data as any).to || 'destinatário'}`
      : 'Processando notificação';

    logger.info("NotificationService", messageInfo);

    try {
      // Executa o handler fornecido com o conteúdo da mensagem
      await handler(data);

      // Confirma o processamento
      channel.ack(raw);
    } catch (error) {
      logger.error("Queue", `Erro ao processar notificação: ${error}`);
      channel.nack(raw, false, false);
    }
  })
}