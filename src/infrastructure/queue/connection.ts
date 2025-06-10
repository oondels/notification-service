import amqp from "amqplib";
import { config } from "../../config/dotenv";
import logger from "../../utils/logger";

let connection: ReturnType<typeof amqp.connect> extends Promise<infer T> ? T : never;
let connected: boolean;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export async function connectQueue() {
  if (connected) return connection;

  connection = await amqp.connect(config.rabbitmqUrl);
  reconnectAttempts = 0;

  // Gerenciar fechamento de conexão
  connection.on('close', async (err) => {
    logger.error("RabbitMQ", `Conexão fechada: ${err?.message || 'Sem detalhes'}`);
    connected = false;

    // Tenta reconectar ao serviço
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = Math.min(1000 * reconnectAttempts, 30000);
      logger.info("RabbitMQ", `Tentando reconectar em ${delay / 1000}s... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

      setTimeout(async () => {
        try {
          await connectQueue();
          connected = true
        } catch (error) {
          logger.error("RabbitMQ", `Falha na reconexão: ${error}`);
        }
      }, delay);
    }
  });

  connected = true;
  return connection;
}
