import { Channel, ConsumeMessage, Options } from 'amqplib';
import { randomUUID } from 'crypto';
import { config } from "../../config/dotenv";
import { connectQueue, onQueueConnected } from "./connection"
import logger from "../../utils/logger";

const RETRY_HEADER = 'x-retry-count';

let publishChannel: Channel | null = null;
let publishChannelPromise: Promise<Channel> | null = null;
const readyQueues = new Set<string>();

interface QueueTopology {
  main: string;
  retry: string;
  delayed: string;
  deadLetter: string;
}

function getQueueTopology(queueName: string): QueueTopology {
  return {
    main: queueName,
    retry: `${queueName}.retry`,
    delayed: `${queueName}.delayed`,
    deadLetter: `${queueName}.dlq`,
  };
}

async function assertQueueTopology(channel: Channel, queueName: string) {
  const topology = getQueueTopology(queueName);

  await channel.assertQueue(topology.deadLetter, { durable: true });
  await channel.assertQueue(topology.main, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": topology.deadLetter,
    },
  });
  await channel.assertQueue(topology.retry, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": topology.main,
    },
  });
  await channel.assertQueue(topology.delayed, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": topology.main,
    },
  });
}

function resetPublishChannel() {
  publishChannel = null;
  publishChannelPromise = null;
  readyQueues.clear();
}

async function getPublishChannel() {
  if (publishChannel) return publishChannel;
  if (publishChannelPromise) return publishChannelPromise;

  publishChannelPromise = (async () => {
    const conn = await connectQueue();
    const channel = await conn.createChannel();

    channel.on('close', () => {
      logger.warn("Queue", "Canal de publicação fechado.");
      resetPublishChannel();
    });

    channel.on('error', (error) => {
      logger.error("Queue", `Erro no canal de publicação: ${error.message}`);
    });

    publishChannel = channel;
    publishChannelPromise = null;
    return channel;
  })().catch((error) => {
    publishChannelPromise = null;
    throw error;
  });

  return publishChannelPromise;
}

/**
 * Publica uma mensagem na fila do RabbitMQ
 * com ou sem delay
 * 
 * @template T - Tipo do payload a ser publicado
 * @param {string} queueName - Nome da fila onde a mensagem será publicada
 * @param {T} payload - Dados a serem enviados para a fila
 * @param {number} delay - Delay em ms para agendamento
 * @returns {Promise<void>}
 */
export async function publish<T>(queueName: string, payload: T, delay: number = 0) {
  const channel = await getPublishChannel();
  if (!readyQueues.has(queueName)) {
    await assertQueueTopology(channel, queueName);
    readyQueues.add(queueName);
  }

  const topology = getQueueTopology(queueName);
  const messageId = randomUUID();
  const body = Buffer.from(JSON.stringify(payload));

  if (delay > 0) {
    channel.sendToQueue(topology.delayed, body, {
      persistent: true,
      expiration: String(delay),
      messageId,
    });
    logger.info("Queue", `Mensagem ${messageId} publicada em ${topology.delayed} com delay de ${delay}ms.`);
  } else {
    channel.sendToQueue(topology.main, body, { persistent: true, messageId });
    logger.info("Queue", `Mensagem ${messageId} publicada em ${topology.main}.`);
  }
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
  let channel: Channel | null = null;
  let starting = false;

  const startConsumer = async () => {
    if (starting) return;
    starting = true;

    try {
      if (channel) {
        try {
          await channel.close();
        } catch {
          // Canal pode já estar fechado em reconexão.
        }
      }

      const conn = await connectQueue();
      channel = await conn.createChannel();

      await assertQueueTopology(channel, queueName);
      await channel.prefetch(1);

      channel.on('close', () => {
        logger.warn("Queue", `Canal de consumo da fila ${queueName} foi fechado.`);
      });

      channel.on('error', (error) => {
        logger.error("Queue", `Erro no canal de consumo da fila ${queueName}: ${error.message}`);
      });

      await channel.consume(queueName, async (raw: ConsumeMessage | null) => {
        if (!raw || !channel) return;

        let data: T;
        try {
          data = JSON.parse(raw.content.toString()) as T;
        } catch (error) {
          logger.error("Queue", `Mensagem inválida na fila ${queueName}. Erro: ${error}`);
          channel.nack(raw, false, false);
          return;
        }

        const headers = raw.properties.headers ?? {};
        const retryCount = Number(headers[RETRY_HEADER] ?? 0);
        const messageId = raw.properties.messageId ?? 'no-message-id';

        logger.info("Queue", `Processando mensagem ${messageId} da fila ${queueName} (tentativa ${retryCount + 1}).`);

        try {
          await handler(data);
          channel.ack(raw);
          logger.info("Queue", `Mensagem ${messageId} processada com sucesso.`);
        } catch (error) {
          if (retryCount < config.queueMaxRetryAttempts) {
            const nextRetry = retryCount + 1;
            const retryDelay = config.queueRetryBaseDelayMs * (2 ** retryCount);
            const topology = getQueueTopology(queueName);

            const retryOptions: Options.Publish = {
              persistent: true,
              messageId,
              correlationId: raw.properties.correlationId,
              contentType: raw.properties.contentType,
              contentEncoding: raw.properties.contentEncoding,
              headers: {
                ...headers,
                [RETRY_HEADER]: nextRetry,
              },
              expiration: String(retryDelay),
            };

            try {
              channel.sendToQueue(topology.retry, Buffer.from(raw.content), retryOptions);
              channel.ack(raw);
            } catch (retryError) {
              logger.error("Queue", `Falha ao republicar mensagem ${messageId} para retry: ${retryError}`);
              channel.nack(raw, false, true);
              return;
            }

            logger.warn(
              "Queue",
              `Falha ao processar mensagem ${messageId}. Reagendada para retry ${nextRetry}/${config.queueMaxRetryAttempts} em ${retryDelay}ms. Erro: ${error}`
            );
            return;
          }

          logger.error(
            "Queue",
            `Mensagem ${messageId} excedeu o limite de retries (${config.queueMaxRetryAttempts}) e será enviada para DLQ. Erro: ${error}`
          );
          channel.nack(raw, false, false);
        }
      });

      logger.info("Queue", `Consumidor iniciado para fila ${queueName}.`);
    } finally {
      starting = false;
    }
  };

  onQueueConnected(() => {
    void startConsumer();
  });

  await startConsumer();
}
